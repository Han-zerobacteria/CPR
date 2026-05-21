# 인증 세션 복구 및 전역 인증 상태 요구사항 정의서

날짜: 2026-05-21

## 1. 목적

사용자가 로그인 후 새로고침하거나 앱을 다시 열어도 refresh token이 유효하면 로그인 상태를 복구한다.

보호 페이지 접근 시 인증 상태를 정확히 판단하고, 인증되지 않은 사용자는 로그인 페이지로 이동시킨다.

---

## 2. 참고

프로젝트 구조 및 개발 규칙은 `AGENTS.md`를 따른다.

---

## 3. 적용 범위

- 전체 앱 초기화
- 공개 인증 라우트
  - `/login`
  - `/signup`
- 보호 라우트
  - `/upload`
  - `/saved`
  - `/mypage`
  - `/settings`
- 로그인
- 회원가입
- 로그아웃
- 새로고침
- access token 만료 및 재발급

---

## 4. 토큰 저장 정책

- access token은 프론트엔드 메모리에만 저장한다.
- 프론트엔드 인증 상태 관리는 `zustand` store를 사용한다.
- `zustand` `persist`는 사용하지 않는다.
- refresh token은 백엔드가 설정하는 httpOnly cookie로만 관리한다.
- 프론트엔드는 refresh token 값을 직접 읽거나 저장하지 않는다.
- access token과 refresh token 모두 `localStorage` 및 `sessionStorage`에 저장하지 않는다.

---

## 5. 인증 상태 모델

전역 인증 상태는 다음 값을 가진다.

```txt
status: "idle" | "checking" | "authenticated" | "unauthenticated"
accessToken: string | null
user: AuthUser | null
```

상태 의미:

| 상태              | 의미                                      |
| ----------------- | ----------------------------------------- |
| idle              | 앱 초기화 직후 아직 세션 확인을 시작하지 않음 |
| checking          | refresh token으로 세션 복구 중             |
| authenticated     | access token 및 사용자 정보가 구성됨       |
| unauthenticated   | 인증되지 않았거나 세션 복구 실패           |

---

## 6. 앱 시작 시 세션 복구 흐름

앱 최초 로드 시 다음 순서로 세션을 복구한다.

```txt
1. status = checking
2. POST /api/auth/refresh/
3. refresh 성공 시 accessToken 저장
4. GET /api/auth/me/
5. me 성공 시 user/profile 정보를 저장하고 authenticated 상태로 전환
6. refresh 또는 me 실패 시 accessToken/user를 비우고 unauthenticated 상태로 전환
```

앱 시작 세션 복구 실패는 사용자에게 별도 오류로 노출하지 않는다.

---

## 7. 보호 라우트 정책

- 인증 확인 중에는 보호 페이지 내용을 보여주지 않고 로딩 상태를 표시한다.
- 인증 성공 시 보호 페이지를 표시한다.
- 인증 실패 시 `/login`으로 이동한다.
- 로그인 후 기본 이동 경로는 `/`이다.
- 추후 redirect 파라미터를 도입하면 원래 접근하려던 페이지로 이동할 수 있다.

---

## 8. 공개 인증 라우트 정책

- 이미 인증된 사용자가 `/login` 또는 `/signup`에 접근하면 `/`로 이동한다.
- 인증 확인 중에는 로그인/회원가입 폼을 먼저 보여주지 않고 로딩 상태를 표시한다.
- 인증되지 않은 사용자에게만 로그인/회원가입 폼을 표시한다.

---

## 9. 헤더 인증 UI 정책

- 인증 확인 중에는 로그인 버튼을 먼저 노출하지 않는다.
- 인증 확인 중에는 헤더 우측 레이아웃 크기를 유지하여 버튼 깜빡임과 레이아웃 이동을 줄인다.
- 인증 성공 시 닉네임과 로그아웃 버튼을 표시한다.
- 인증 실패 시 로그인 버튼을 표시한다.

---

## 10. 토큰 만료 및 재발급 정책

- API 요청이 401을 반환하면 access token refresh를 1회 시도한다.
- refresh 성공 시 새 access token을 저장하고 원 요청을 1회 재시도한다.
- refresh 실패 시 인증 세션을 초기화한다.
- 동시에 여러 요청이 401을 받아도 refresh 요청은 1개만 수행한다.
- API client는 세션 정리까지만 담당하고, 라우팅은 라우트 가드가 담당한다.

---

## 11. 로그아웃 정책

- 로그아웃 시 `POST /api/auth/logout/`을 호출한다.
- 로그아웃 API 성공/실패와 관계없이 프론트엔드 auth store를 초기화한다.
- refresh cookie 삭제는 백엔드 응답에 따른다.
- 로그아웃 후 `/login`으로 이동한다.

---

## 12. 에러 및 로딩 UI

- 앱 시작 세션 복구 실패는 별도 에러를 노출하지 않는다.
- 보호 페이지 인증 확인 중에는 간단한 로딩 화면을 표시한다.
- 공개 인증 라우트 인증 확인 중에도 폼을 먼저 표시하지 않는다.
- 사용자가 직접 수행한 로그인/회원가입/로그아웃 실패만 명확히 표시한다.

---

## 13. API 계약

사용 API:

```txt
POST /api/auth/refresh/
GET /api/auth/me/
POST /api/auth/logout/
POST /api/auth/login/
POST /api/accounts/signup/
```

`POST /api/auth/refresh/` 응답:

```json
{
  "accessToken": "access-token"
}
```

`GET /api/auth/me/` 응답:

```json
{
  "user": {
    "id": 1,
    "login_id": "user_id"
  },
  "profile": {
    "nickname": "nickname",
    "profile_image_url": null
  }
}
```
