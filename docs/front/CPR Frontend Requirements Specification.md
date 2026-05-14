# CPR Frontend Requirements Specification

## 1. 문서 목적

본 문서는 CPR(Cloth Personal Rescue) 프로젝트의 프론트엔드 초기 구조, 페이지 설계, 상태 관리, 렌더링 전략 및 UI 정책을 정의한다.

초기 MVP 단계에서 다음 목표를 달성하는 것을 목적으로 한다.

- 사용자 흐름 중심 구조 설계
- 이미지 기반 서비스에 적합한 렌더링 구조 확보
- 확장 가능한 App Router 기반 설계
- SSR 기반 초기 렌더링 성능 확보
- 인증/비인증 상태 분리
- 추후 PWA 및 AI 기능 확장 가능 구조 확보

---

# 2. 프로젝트 개요

## 서비스 개념

CPR은 사용자가 보유한 의류를 기반으로 코디 요청을 업로드하고,
다른 사용자(인플루언서/패션 감각 보유 유저)가 스타일링을 제안하는 이미지 기반 코디 플랫폼이다.

---

## 핵심 UX 특징

- 이미지 소비 비중이 높음
- 초기 렌더링 속도가 중요
- 모바일 사용 비율이 높을 것으로 예상
- 피드 탐색 중심 구조
- 로그인 전 콘텐츠 탐색 가능
- 모바일 터치 기반 인터랙션 고려

---

# 3. 기술 스택

## Frontend

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Zustand
- TanStack Query
- Axios

---

## Infra

- AWS S3
- CloudFront CDN

---

# 4. 핵심 설계 방향

# 4-1. App Router 기반 구조

## 목적

- SSR 활용
- 레이아웃 분리
- 페이지 단위 캐싱 전략 적용
- SEO 대응 가능 구조 확보

---

# 4-2. 이미지 중심 최적화

## 목적

이미지 기반 서비스 특성상 초기 렌더링 성능과 이미지 로딩 최적화를 확보한다.

---

## 정책

- `next/image` 사용
- AWS S3 + CloudFront 기반 이미지 CDN 사용
- WebP 우선 적용
- AVIF 추후 고려
- Lazy Loading 적용
- Blur Placeholder 고려
- Skeleton UI 적용

---

# 4-3. 인증 상태 분리

## 목적

인증 상태와 서버 상태를 명확히 분리하여 유지보수성과 안정성을 확보한다.

---

## 정책

### Access Token

- Zustand 메모리 저장

### Refresh Token

- httpOnly Cookie 저장

### 서버 상태

- TanStack Query 관리

---

# 4-4. 안정적인 인증 구조

## 정책

- refresh 전용 Axios Client 분리
- refresh 요청에는 interceptor 미적용
- `_retry` 플래그 적용
- `refreshPromise` 공유 패턴 적용
- 동시 401 요청 처리 대응
- refresh 실패 시 로그인 페이지 이동

---

# 5. 반응형 레이아웃 및 PWA 고려사항

## 목적

Mobile First 기반으로 설계하되,
Tablet/Desktop 환경에서도 일관된 사용자 경험을 제공한다.

또한 추후 PWA 적용이 가능하도록 구조를 설계한다.

---

## 기준 프레임

| 디바이스 |      프레임 이름 |   크기(px) | Layout Grid 설정                      | 설명                  |
| -------- | ---------------: | ---------: | ------------------------------------- | --------------------- |
| Mobile   |   `Mobile (375)` |  375 × 812 | Columns: 4 / Gutter: 16 / Margin: 16  | iPhone 기준 세로형 UI |
| Tablet   |   `Tablet (768)` | 768 × 1024 | Columns: 8 / Gutter: 24 / Margin: 32  | 2열 카드 구조         |
| Desktop  | `Desktop (1440)` | 1280 × 720 | Columns: 12 / Gutter: 32 / Margin: 80 | 기준 디자인 프레임    |

---

## 반응형 정책

- Mobile First 방식으로 구현한다.
- Tailwind CSS breakpoint 기준으로 UI를 분기한다.
- 모바일에서는 하단 탭 네비게이션을 우선 고려한다.
- 태블릿 이상에서는 카드형 콘텐츠를 2열 이상 배치할 수 있다.
- 데스크톱에서는 최대 콘텐츠 폭을 제한한다.
- 콘텐츠 밀도와 카드 비율은 화면 크기에 따라 조정한다.

---

## PWA 고려사항

- 터치 인터랙션 기반 UI 우선 설계
- 하단 네비게이션 구조 고려
- layout shift 최소화
- skeleton UI 활용
- 추후 offline fallback 대응 고려
- 홈 화면 추가 환경 고려

---

# 6. 페이지 구조

# 공개 페이지

| 페이지          | 설명          |
| --------------- | ------------- |
| `/`             | 메인 피드     |
| `/login`        | 로그인        |
| `/signup`       | 회원가입      |
| `/post/[id]`    | 게시글 상세   |
| `/profile/[id]` | 사용자 프로필 |

---

# 인증 필요 페이지

| 페이지      | 설명             |
| ----------- | ---------------- |
| `/upload`   | 코디 요청 업로드 |
| `/mypage`   | 내 프로필        |
| `/settings` | 설정             |
| `/saved`    | 저장한 게시글    |

---

# 7. 페이지별 요구사항

# 7-1. 메인 피드 `/`

## 목적

사용자가 코디 콘텐츠를 탐색하는 핵심 페이지

---

## 주요 기능

- 최신 피드 조회
- 무한 스크롤
- 좋아요
- 저장 기능
- 프로필 이동
- 게시글 상세 이동

---

## UI 구성

### 피드 카드

- 대표 이미지
- 작성자 프로필 이미지
- 닉네임
- 좋아요 수
- 태그
- 저장 버튼

---

## 성능 요구사항

- SSR 우선 고려
- Skeleton UI 적용
- Lazy Loading 적용
- Intersection Observer 기반 Infinite Scroll 구현

---

# 7-2. 로그인 `/login`

## 주요 기능

- 로그인 요청
- 토큰 저장
- 인증 상태 갱신
- refresh 기반 세션 유지

---

## 예외 처리

| 상황         | 처리               |
| ------------ | ------------------ |
| 로그인 실패  | 에러 메시지 출력   |
| 서버 오류    | 재시도 유도        |
| refresh 만료 | 로그인 페이지 이동 |

---

# 7-3. 회원가입 `/signup`

## 주요 기능

- 아이디 중복 확인
- 비밀번호 검증
- 프로필 이미지 업로드
- 자기소개 입력

---

## 입력 검증

| 항목     | 정책              |
| -------- | ----------------- |
| 아이디   | trim 후 검증      |
| 비밀번호 | 공백 유지         |
| 닉네임   | trim 후 검증      |
| bio      | 최대 500자        |
| 이미지   | jpg/png/webp 허용 |

---

## UX 요구사항

- 실시간 validation
- 즉시 에러 메시지 출력
- 이미지 preview 제공

---

# 7-4. 게시글 상세 `/post/[id]`

## 주요 기능

- 이미지 상세 조회
- 코디 설명
- 댓글
- 저장
- 좋아요

---

## 추가 고려사항

- 이미지 확대
- 공유 기능
- 관련 코디 추천

---

# 7-5. 프로필 `/profile/[id]`

## 주요 기능

- 사용자 정보 조회
- 업로드 게시글 조회
- 저장 게시글 탭
- 팔로우 기능(추후)

---

# 8. 공통 레이아웃 구조

# Public Layout

적용 페이지:

- `/`
- `/login`
- `/signup`
- `/post/[id]`

---

# Protected Layout

적용 페이지:

- `/upload`
- `/mypage`
- `/settings`
- `/saved`

---

# 9. 상태 관리 구조

# Zustand

## 관리 대상

| 상태  | 설명          |
| ----- | ------------- |
| auth  | 인증 상태     |
| modal | 모달 상태     |
| ui    | toast/sidebar |

---

# TanStack Query

## 관리 대상

| 데이터   | 설명   |
| -------- | ------ |
| feed     | 피드   |
| post     | 게시글 |
| profile  | 프로필 |
| comments | 댓글   |

---

# 10. API 통신 구조

# Axios Client 분리

| Client        | 설명              |
| ------------- | ----------------- |
| apiClient     | 일반 API 요청     |
| refreshClient | refresh 전용 요청 |

---

## 정책

- interceptor 분리
- refresh 무한 루프 방지
- refreshPromise 공유
- 동시 만료 처리 대응

---

# 11. 공통 마크업 정책

## 시맨틱 마크업 정책

- 불필요한 div 기반 구조를 지양하고 시맨틱 태그를 적극 활용한다.
- `section`, `article`, `main`, `nav`, `header`, `footer` 등을 활용하여 구조적 의미를 명확히 한다.
- SEO 및 접근성을 고려한 마크업 구조를 지향한다.
- 스크린 리더 및 접근성 대응이 가능하도록 구조를 설계한다.

---

## UI 정책

- 재사용 가능한 컴포넌트 구조를 우선 고려한다.
- 컴포넌트 책임 범위를 명확히 분리한다.
- Feature 단위 구조를 우선 고려한다.
- Skeleton UI 및 Loading 상태를 기본 제공한다.

---

# 12. 디렉토리 구조 초안

```txt
front/
 ┣ src/
 ┃ ┣ app/
 ┃ ┃ ┣ (public)/
 ┃ ┃ ┣ (protected)/
 ┃ ┃ ┣ api/
 ┃ ┃ ┗ layout.tsx
 ┃ ┣ components/
 ┃ ┃ ┣ common/
 ┃ ┃ ┣ feed/
 ┃ ┃ ┣ auth/
 ┃ ┃ ┗ profile/
 ┃ ┣ features/
 ┃ ┃ ┣ auth/
 ┃ ┃ ┣ feed/
 ┃ ┃ ┣ post/
 ┃ ┃ ┗ profile/
 ┃ ┣ stores/
 ┃ ┣ hooks/
 ┃ ┣ lib/
 ┃ ┃ ┣ axios/
 ┃ ┃ ┣ query/
 ┃ ┃ ┗ utils/
 ┃ ┣ types/
 ┃ ┗ constants/
```

---

# 13. 접근 권한 정책

| 페이지      | 비로그인 접근 |
| ----------- | ------------- |
| 메인 피드   | 가능          |
| 게시글 조회 | 가능          |
| 업로드      | 불가능        |
| 저장 기능   | 불가능        |
| 마이페이지  | 불가능        |

---

# 14. 에러 처리 정책

## 공통 정책

- Toast 기반 에러 알림
- 서버 에러 메시지 매핑
- 네트워크 에러 대응
- fallback UI 제공

---

# 15. SEO 및 메타데이터 정책

## 정책

- Open Graph 적용
- Dynamic Metadata 적용
- 게시글별 meta 생성
- 공유 이미지 대응

---

# 16. 추후 확장 고려사항

## 예정 기능

- AI 코디 추천
- 팔로우 시스템
- 댓글 알림
- 실시간 알림
- 검색 시스템
- 태그 기반 추천
- 관리자(Admin) 페이지
- PWA 적용

---

# 17. 초기 MVP 우선순위

# 1차

- 로그인
- 회원가입
- 메인 피드
- 게시글 조회
- 업로드

---

# 2차

- 저장 기능
- 프로필
- 댓글

---

# 3차

- 추천 시스템
- 검색
- 알림
- 팔로우 시스템
