# 인증 세션 복구 및 전역 인증 상태 구현 노트

날짜: 2026-05-21

## 범위

인증 세션 복구 요구사항에 따라 새로고침 후 refresh token이 유효하면 로그인 상태를 복구하고, 보호/공개 인증 라우트가 전역 인증 상태를 기준으로 동작하도록 정리했다.

이 작업의 내용은 다음과 같다:

- `zustand`를 Docker 기준으로 설치하고 lockfile을 갱신했다.
- auth store를 `zustand create()` 기반으로 전환했다.
- access token은 `zustand` 메모리 store에만 저장한다.
- `zustand` `persist`는 사용하지 않는다.
- 앱 최초 로드 시 refresh token cookie로 access token을 재발급받는다.
- refresh 성공 후 `/api/auth/me/`를 호출해 사용자/프로필 정보를 구성한다.
- 보호 라우트는 인증 확인 중 로딩 화면을 표시하고, 비인증 상태에서는 `/login`으로 이동한다.
- `/login`, `/signup`은 인증 확인 중 폼을 먼저 보여주지 않고, 인증 사용자는 `/`로 이동한다.
- 헤더는 인증 확인 중 로그인 버튼을 먼저 보여주지 않도록 placeholder를 렌더링한다.
- 로그아웃은 API 호출 성공/실패와 관계없이 프론트 세션을 초기화하고 `/login`으로 이동한다.
- 401 응답 시 refresh 응답 필드명을 백엔드 계약에 맞춰 `accessToken`으로 수정했다.

---

## 변경된 파일

```txt
front/package.json
front/package-lock.json
front/src/app/(public)/login/page.tsx
front/src/app/(public)/signup/page.tsx
front/src/app/providers.tsx
front/src/components/layout/AppHeader.tsx
front/src/components/layout/ProtectedShell.tsx
front/src/components/layout/PublicOnlyShell.tsx
front/src/features/auth/api/login-api.ts
front/src/features/auth/api/session-api.ts
front/src/features/auth/components/AuthBootstrap.tsx
front/src/lib/axios/api-client.ts
front/src/stores/auth-store.ts
```

---

## 의존성 변경

Docker 기준으로 다음 명령을 사용해 `zustand`를 추가했다.

```txt
docker compose run --rm front npm install zustand
```

추가된 dependency:

```json
{
  "zustand": "^5.0.13"
}
```

`package-lock.json`도 함께 갱신했다.

---

## 인증 저장소

`front/src/stores/auth-store.ts`는 `zustand` 기반 store로 전환했다.

저장 값:

```txt
status
accessToken
user
```

제공 action:

```txt
startChecking()
setSession()
setAccessToken()
clearSession()
```

access token은 `zustand` store에 저장되지만, `persist`를 사용하지 않으므로 브라우저 저장소에는 남지 않는다.

새로고침 시 메모리 store는 초기화되고, `AuthBootstrap`이 refresh cookie 기반으로 access token을 다시 발급받는다.

---

## 세션 복구 흐름

`front/src/features/auth/components/AuthBootstrap.tsx`를 추가하고 `front/src/app/providers.tsx`에서 앱 전체를 감싼다.

동작 순서:

```txt
1. 앱 mount
2. status가 idle이면 checking으로 전환
3. POST /api/auth/refresh/
4. 성공 시 accessToken을 store에 저장
5. GET /api/auth/me/
6. 성공 시 user/profile을 포함한 세션 구성
7. 실패 시 clearSession()
```

React Strict Mode에서 effect가 중복 실행될 수 있으므로 `useRef`로 bootstrap 실행을 1회로 제한했다.

---

## 라우트 가드

### 보호 라우트

`front/src/components/layout/ProtectedShell.tsx`는 `status`를 기준으로 동작한다.

```txt
idle/checking       -> 로딩 화면
authenticated       -> children 렌더링
unauthenticated     -> /login으로 replace
```

### 공개 인증 라우트

`front/src/components/layout/PublicOnlyShell.tsx`를 추가했다.

`/login`, `/signup`에서 사용한다.

```txt
idle/checking       -> 로딩 화면
authenticated       -> / 로 replace
unauthenticated     -> children 렌더링
```

---

## 헤더 UX

새로고침 직후 세션 복구 중인 상태에서 로그인 버튼이 잠깐 보였다가 닉네임/로그아웃으로 바뀌는 깜빡임을 막았다.

`front/src/components/layout/AppHeader.tsx`는 다음 기준으로 렌더링한다.

```txt
idle/checking       -> 투명 placeholder
authenticated       -> 닉네임 + 로그아웃 버튼
unauthenticated     -> 로그인 버튼
```

---

## API client 변경

`front/src/lib/axios/api-client.ts`의 refresh 응답 타입을 백엔드 계약에 맞췄다.

이전:

```txt
access
```

현재:

```txt
accessToken
```

401 처리 정책:

```txt
1. 원 요청이 401이면 refresh 1회 시도
2. refresh 성공 시 새 access token 저장
3. 원 요청 1회 재시도
4. refresh 실패 시 clearSession()
```

동시 401 요청은 기존 `refreshPromise` 공유 로직으로 refresh 요청을 1개로 합친다.

---

## 로그아웃

`front/src/features/auth/api/session-api.ts`에 `logout()`을 추가했다.

헤더 로그아웃 버튼은 다음 순서로 동작한다.

```txt
1. POST /api/auth/logout/
2. 성공/실패와 관계없이 clearSession()
3. /login으로 replace
```

---

## 검증

Docker 기준으로 검증했다.

```txt
docker compose build front
docker compose run --rm front npm run lint
docker compose run --rm front npx tsc --noEmit
docker compose run --rm front npm run build
```

결과:

```txt
통과
```

참고:

`npm install` 및 Docker image build 과정에서 npm audit이 다음 취약점을 보고했다.

```txt
3 vulnerabilities (2 moderate, 1 high)
```

이번 인증 세션 복구 범위에서는 자동 수정하지 않았다.

---

## 남은 고려사항

- 보호 라우트 redirect 파라미터는 아직 구현하지 않았다.
- 인증 실패 후 원래 접근하려던 페이지로 되돌리는 정책은 후속 요구사항으로 분리한다.
- refresh token cookie 속성, SameSite, CORS, blacklist 동작은 백엔드 인증 정책과 함께 통합 검증이 필요하다.
