# 로그인 프론트엔드 구현 노트

날짜: 2026-05-21

## 범위

로그인 페이지 요구사항에 따라 `/login`의 정적 임시 폼을 실제 인증 흐름이 동작하는 클라이언트 폼으로 교체했습니다.

이 작업의 내용은 다음과 같습니다:

- `/login` 페이지에서 `LoginForm` 컴포넌트 렌더링.
- `login_id`, `password` 필수값 검증.
- 입력 필드 하단 에러 메시지 표시.
- 로그인 요청 중 버튼 비활성화 및 로딩 텍스트 표시.
- 로그인 실패 시 요구사항의 통합 에러 메시지 표시.
- 로그인 성공 시 access token을 메모리 auth store에 임시 저장.
- 로그인 응답에 없는 프로필 정보를 채우기 위해 `/api/auth/me/` 추가 호출.
- `/api/auth/me/` 응답으로 `nickname`, `profileImageUrl`을 포함한 세션 구성.
- 세션 구성 완료 후 `/`로 이동.
- 회원가입 페이지로 이동하는 링크 제공.
- CPR 브랜드 primary black을 버튼, 제목, 링크, 포커스 상태에 적용하기 위한 전역 색상 토큰 추가.

## 변경된 프론트엔드 구조

```txt
front/src/app/(public)/login/page.tsx
front/src/features/auth/api/login-api.ts
front/src/features/auth/components/LoginForm.tsx
front/src/features/auth/model/login-types.ts
front/src/features/auth/model/login-validation.ts
front/src/app/globals.css
```

## 사용된 API 계약

```txt
POST /api/auth/login/
GET /api/auth/me/
```

로그인 요청:

```json
{
  "login_id": "user_id",
  "password": "password"
}
```

로그인 응답:

```json
{
  "accessToken": "access-token",
  "user": {
    "id": 1,
    "login_id": "user_id"
  }
}
```

`/api/auth/me/` 응답:

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

## 중요한 구현 참고 사항

- 백엔드 `LoginResponseSerializer`는 현재 `profile`을 포함하지 않습니다.
- 프론트엔드 `auth-store`는 `nickname`을 필수 사용자 정보로 사용합니다.
- 따라서 로그인 직후 `/api/auth/me/`를 추가 호출하는 방식으로 프로필 정보를 채웁니다.
- `/api/auth/me/` 호출 전에 access token을 store에 먼저 저장하여 Authorization header가 구성되도록 했습니다.
- `/api/auth/me/` 조회까지 성공한 뒤 `setSession`으로 최종 세션을 저장합니다.
- 로그인 실패 메시지는 백엔드 메시지를 그대로 노출하지 않고 요구사항의 한국어 통합 메시지를 사용합니다.
- 로그인 페이지에서는 회원가입의 중복 검사 API를 사용하지 않습니다.

## 색상 정책 반영

전역 색상 토큰을 `front/src/app/globals.css`에 추가했습니다.

```css
--brand-primary: #09090b;
--brand-primary-hover: #27272a;
--brand-surface: #ffffff;
--brand-border: #e4e4e7;
--brand-muted: #71717a;
--brand-danger: #dc2626;
--brand-danger-surface: #fef2f2;
--brand-danger-border: #fecaca;
```

브랜드 primary color가 black이라는 요구사항은 전체 화면을 dark UI로 만드는 의미가 아니라, 주요 액션과 강조 상태에 black을 사용하는 것으로 정리했습니다.

## 현재 UI 참고 사항

- 로그인 버튼은 활성/비활성 상태 모두 화면에서 명확히 보여야 합니다.
- 버튼 색상은 `LoginForm.tsx`의 로그인 버튼 `className`에서 조정합니다.
- 버튼 배경은 `bg-[var(--brand-primary)]`를 사용합니다.
- 버튼 글자색은 현재 `text-white`를 사용합니다.
- disabled 구분은 `disabled:opacity-45`로 처리합니다.

## 위험 요소 및 후속 조치

- access token을 먼저 store에 저장한 뒤 `/api/auth/me/`를 호출하므로, 프로필 조회 실패 시 `clearSession`으로 중간 인증 상태를 정리해야 합니다.
- 로그인 버튼 disabled/active 스타일은 실제 브라우저에서 DevTools로 최종 computed style 확인이 필요합니다.
- Tailwind v4 theme token 클래스와 CSS variable 직접 참조 방식이 혼재되어 있으므로, 추후 전체 디자인 토큰 사용 방식을 정리하는 것이 좋습니다.
- 회원가입 화면은 아직 일부 `zinc-*` 색상을 직접 사용하므로, 브랜드 토큰 기준으로 통일할 여지가 있습니다.

## 검증

2026-05-21 통과:

```txt
npm run lint
npx tsc --noEmit
```

## 브랜치

```txt
codex/front/login
```
