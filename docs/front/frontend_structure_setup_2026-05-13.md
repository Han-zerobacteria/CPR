# CPR 프론트엔드 초기 구조 세팅 기록

## 1. 작업 일시

- 날짜: 2026-05-13
- 대상: `front/`
- 환경 기준: Docker Compose 개발 환경

## 2. 목적

CPR 프론트엔드 MVP 구현을 시작하기 전에 Next.js App Router 기반의 라우트 그룹, 공통 레이아웃, 상태 관리, API 통신 구조를 먼저 마련한다.

이번 작업은 실제 API 연동 기능 구현이 아니라, 이후 로그인, 회원가입, 피드, 업로드 기능을 붙일 수 있는 초기 골격을 만드는 범위로 제한한다.

## 3. 반영된 구조

App Router route group을 다음과 같이 분리했다.

```txt
front/src/app/
  (public)/
    page.tsx
    login/page.tsx
    signup/page.tsx
    post/[id]/page.tsx
    profile/[id]/page.tsx
    layout.tsx
  (protected)/
    upload/page.tsx
    mypage/page.tsx
    settings/page.tsx
    saved/page.tsx
    layout.tsx
  layout.tsx
  providers.tsx
```

공통 영역은 다음 디렉토리로 나누었다.

```txt
front/src/components/
  common/
  layout/
  feed/
  auth/
  profile/

front/src/features/
  auth/
  feed/
  post/
  profile/

front/src/lib/
  axios/
  query/
  utils/

front/src/stores/
front/src/hooks/
front/src/types/
front/src/constants/
```

## 4. 주요 반영 사항

- 기본 Next.js 템플릿 홈 화면을 제거하고 CPR 메인 피드 skeleton 화면을 추가했다.
- 공개 라우트와 보호 라우트를 App Router group으로 분리했다.
- 모바일 하단 내비게이션과 상단 헤더를 포함한 `AppShell`을 추가했다.
- 보호 페이지는 `ProtectedShell`에서 인증 상태가 없을 때 로그인 안내 화면을 보여주도록 준비했다.
- TanStack Query provider를 연결할 진입점인 `providers.tsx`를 추가했다.
- 인증 상태와 UI 상태를 담을 store 파일을 추가했다.
- 일반 API 요청용 `apiClient`와 refresh 전용 `refreshClient`를 분리할 파일 구조를 추가했다.
- `apiClient`에는 access token 주입, 401 refresh 재시도, `refreshPromise` 공유 패턴의 기본 형태를 준비했다.
- `next.config.ts`에 CloudFront/S3 이미지 도메인 remote pattern을 추가했다.

## 5. 의존성 정책

이번 작업에서는 새 런타임 의존성을 추가하지 않았다.

초기 구조상 `lib/query`, `lib/axios`, `stores` 디렉토리는 마련했지만, `@tanstack/react-query`, `axios`, `zustand` 실제 도입은 Docker 기반 의존성 설치 및 lockfile 갱신 정책을 정한 뒤 별도 작업에서 진행한다.

## 6. 검증 결과

실행 명령:

```txt
cd front
npm run lint
```

결과:

```txt
eslint 통과
```

## 7. 남은 위험 포인트

- `@tanstack/react-query`, `axios`, `zustand`는 아직 설치하지 않았다. 실제 API 연동 단계에서 Docker 기반 설치와 lockfile 갱신을 함께 처리해야 한다.
- 실제 백엔드 refresh endpoint와 응답 필드명이 확정되면 `apiClient`의 `/api/auth/refresh/` 경로와 `access` 필드를 다시 맞춰야 한다.
- `ProtectedShell`은 현재 access token 메모리 상태만 확인한다. httpOnly refresh cookie 기반 세션 복원 로직은 로그인/인증 API 연동 단계에서 추가해야 한다.
- 피드, 업로드, 프로필 페이지는 UI 골격과 placeholder 상태이며 실제 API 연동은 아직 포함하지 않았다.
