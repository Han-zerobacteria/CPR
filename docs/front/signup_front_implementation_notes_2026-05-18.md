# 가입 프론트엔드 구현 노트

날짜: 2026-05-18

## 범위

가입 페이지 요구사항에 따라 `/signup`에 대한 첫 번째 CPR 가입 프론트엔드 흐름을 구현했습니다.

이 작업의 내용은 다음과 같습니다:

- 모바일 우선 가입 양식 UI.
- `login_id`, `password`, `confirm_password`, `nickname`, `profile_image`, `bio`에 대한 클라이언트 측 유효성 검사.
- `login_id` 및 `nickname` 입력 필드에서 마우스 커서가 이동할 때(blur) 자동 중복 확인.
- 관련 입력 필드가 변경될 때 중복 확인 상태 초기화.
- 중복 확인 시 로딩, 성공 및 오류 상태 처리.
- 프로필 이미지 업로드(선택 사항)를 포함한 멀티파트 가입 요청.
- `URL.createObjectURL`을 통한 프로필 이미지 확장자 유효성 검사 및 미리보기.
- 가입 성공 시 프론트엔드 인증 저장소(auth store)에 세션 매핑.
- 가입 양식에서 로그인 페이지로 연결되는 링크.

## 변경된 프론트엔드 구조

```txt
front/src/app/(public)/signup/page.tsx
front/src/features/auth/api/signup-api.ts
front/src/features/auth/components/SignupForm.tsx
front/src/features/auth/components/ProfileImageUploader.tsx
front/src/features/auth/model/signup-types.ts
front/src/features/auth/model/signup-validation.ts
front/src/lib/axios/api-client.ts
```

## 사용된 API 계약

```txt
POST /api/accounts/signup/
GET /api/accounts/check-login-id/?login_id=value
GET /api/accounts/check-nickname/?nickname=value
```

가입 요청은 `multipart/form-data` 형식으로 전송되므로, 선택 사항인 `profile_image`를 계정 필드와 함께 업로드할 수 있습니다.

## 중요한 구현 참고 사항

- `apiClient`는 이제 요청 본문이 `FormData`일 때 기본 `Content-Type: application/json` 헤더를 생략합니다.
- `apiClient`는 이제 파싱된 응답 데이터와 함께 `ApiError`를 발생시켜, 가입 양식에서 필드 수준의 서버 오류를 매핑할 수 있게 되었습니다.
- 프론트엔드 `login_id` 유효성 검사는 백엔드 규칙을 따릅니다: 첫 글자는 소문자여야 하며, 그 뒤에는 소문자, 숫자 또는 `_`가 올 수 있고, 총 4~20자입니다.
- 프론트엔드 `nickname` 유효성 검사는 백엔드 규칙을 따릅니다: 한국어, 영문자, 숫자, `_` 또는 `.`이 가능하며, 2~20자입니다.
- `bio`는 백엔드 직렬화기와 일치하도록 30자로 제한됩니다.
- 사용자가 이미 입력 값을 변경한 경우, 뒤늦게 도착한 중복 검사 응답은 무시됩니다.

## 프로필 이미지 저장

프론트엔드는 이미지를 미리 보고 제출하는 역할만 합니다. 실제 저장은 Django `ImageField`에서 처리합니다.

현재 백엔드 저장 경로:

```txt
back/media/profiles/{user_id}/{filename}
```

현재 미디어 설정:

```py
MEDIA_URL = “/media/”
MEDIA_ROOT = BASE_DIR / “media”
```

Docker 환경에서 미디어의 영구 저장은 볼륨 구성에 따라 달라집니다. 영구 미디어 볼륨이나 원격 객체 저장소가 없는 경우, 컨테이너가 재생성될 때 업로드된 이미지가 손실될 수 있습니다.

## 위험 요소 및 후속 조치

- 서버 오류 메시지는 현재 대부분 백엔드에서 반환된 그대로 표시되므로, 추후 현지화 작업이 필요할 수 있습니다.
- 공유 환경에서 프로필 이미지 업로드를 활용하기 전에 Docker 미디어의 영구 저장 방식을 결정해야 합니다.
- 향후 S3/CloudFront 또는 사전 서명된 업로드 경로가 프로덕션 환경의 로컬 미디어 저장소를 대체해야 합니다.
- 로그인 페이지는 아직 임시 상태이며, 가입 페이지와 양식 구성 요소를 공유하지 않습니다.

## 검증

2026-05-18 통과:
