# CPR 인증 및 회원가입 반영 요구사항 정의서

## 1. 목적

본 문서는 CPR 프로젝트에 반영된 인증, 로그인, 회원가입, 프로필 생성, 프로필 이미지 업로드 요구사항을 정리한다.

현재 구현 범위는 Django REST Framework 기반 백엔드 인증 및 회원가입 API이다.

## 2. 인증 식별자 정책

CPR은 로그인 식별자로 `login_id`를 사용한다.

- 이메일 로그인은 사용하지 않는다.
- Django 기본 User 대신 커스텀 User 모델을 사용한다.
- `AUTH_USER_MODEL`은 `accounts.User`로 설정한다.

## 3. User 모델

사용자 인증 정보는 `accounts_user` 테이블에서 관리한다.

주요 필드:

- `id`
- `login_id`
- `password`
- `email`
- `is_active`
- `is_staff`
- `is_superuser`
- `date_joined`
- `last_login`

`login_id`는 unique 제약을 가진다.

## 4. login_id 제약 조건

`login_id`는 다음 조건을 만족해야 한다.

- 4자 이상 20자 이하
- 영문 소문자로 시작
- 영문 소문자, 숫자, `_`만 허용
- 대문자 허용하지 않음
- 중복 불가

예시:

```txt
cpr_user01  가능
01user      불가
cpr.user    불가
CPRUser     불가
```

## 5. Profile 모델

서비스 프로필 정보는 `profiles_profile` 테이블에서 관리한다.

주요 필드:

- `id`
- `user`
- `nickname`
- `role`
- `profile_image`
- `bio`
- `is_public`
- `created_at`
- `updated_at`

User와 Profile은 `OneToOneField`로 연결된다.

## 6. 닉네임 제약 조건

`nickname`은 회원가입 시 필수 입력값이다.

제약 조건:

- 2자 이상 20자 이하
- 한글, 영문, 숫자, `_`, `.` 허용
- 공백 금지
- 앞뒤 공백 금지
- 중복 불가
- 대소문자 구분 없이 중복 방지

예시:

```txt
옷잘입는_민수  가능
cpr.user      가능
a             불가
hello world   불가
```

## 7. Role 정책

Profile의 `role` 필드는 유지한다.

역할:

- `general_user`
- `stylist`

일반 회원가입 API에서는 클라이언트가 `role`을 직접 지정할 수 없다.

회원가입 시 기본값은 항상 `general_user`이다.

스타일리스트 전환은 추후 별도 승인 또는 관리자 기능에서 처리한다.

## 8. 프로필 이미지 정책

프로필 이미지는 선택 입력값이다.

현재 구현은 로컬 파일 저장 방식을 사용한다.

- 저장 필드: `Profile.profile_image`
- 저장 경로: `profiles/{user_id}/{filename}`
- 미업로드 시 `profile_image_url`은 `null`
- 개발 환경에서는 `MEDIA_URL`로 로컬 미디어 파일을 제공한다.

허용 MIME type:

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/avif`

최대 용량:

- 5MB

## 9. 회원가입 API

Endpoint:

```txt
POST /api/auth/signup/
```

요청 형식:

- JSON
- multipart/form-data

필수 입력값:

- `login_id`
- `password`
- `confirm_password`
- `nickname`

선택 입력값:

- `profile_image`
- `bio`

예시 요청:

```json
{
  "login_id": "cpr_user01",
  "password": "password123!",
  "confirm_password": "password123!",
  "nickname": "옷잘입는_민수",
  "bio": "편한 스트릿룩을 좋아해요"
}
```

처리 순서:

```txt
회원가입 요청
-> login_id 제약 및 중복 검사
-> password / confirm_password 일치 검사
-> Django password validator 검사
-> nickname 제약 및 중복 검사
-> profile_image 형식 및 용량 검사
-> User 생성
-> Profile 생성
-> JWT refresh/access token 발급
-> refresh token을 httpOnly cookie로 설정
-> accessToken, user, profile 응답 반환
```

User 생성과 Profile 생성은 `transaction.atomic()` 안에서 처리한다.

## 10. 회원가입 성공 응답

회원가입 성공 시 즉시 로그인 처리한다.

Status:

```txt
201 Created
```

응답 body:

```json
{
  "accessToken": "access-token-value",
  "user": {
    "id": 1,
    "login_id": "cpr_user01"
  },
  "profile": {
    "nickname": "옷잘입는_민수",
    "role": "general_user",
    "profile_image_url": null,
    "bio": "편한 스트릿룩을 좋아해요",
    "is_public": true
  }
}
```

Refresh Token은 body에 포함하지 않고 httpOnly cookie로 내려준다.

## 11. 로그인 API

Endpoint:

```txt
POST /api/auth/login/
```

요청 body:

```json
{
  "login_id": "cpr_user01",
  "password": "password123!"
}
```

성공 응답:

```json
{
  "accessToken": "access-token-value",
  "user": {
    "id": 1,
    "login_id": "cpr_user01"
  }
}
```

Refresh Token은 httpOnly cookie로 내려준다.

## 12. 토큰 재발급 API

Endpoint:

```txt
POST /api/auth/refresh/
```

Refresh Token은 httpOnly cookie에서 읽는다.

성공 응답:

```json
{
  "accessToken": "new-access-token-value"
}
```

Simple JWT 설정:

```python
SIMPLE_JWT = {
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
}
```

## 13. 로그아웃 API

Endpoint:

```txt
POST /api/auth/logout/
```

처리 내용:

- refresh cookie가 있으면 refresh token blacklist 처리
- refresh cookie 삭제

성공 응답:

```txt
204 No Content
```

## 14. 내 정보 API

Endpoint:

```txt
GET /api/auth/me/
```

인증:

- Access Token 필요

응답:

```json
{
  "user": {
    "id": 1,
    "login_id": "cpr_user01"
  },
  "profile": {
    "nickname": "옷잘입는_민수",
    "role": "general_user",
    "profile_image_url": null,
    "bio": "편한 스트릿룩을 좋아해요",
    "is_public": true
  }
}
```

## 15. 반영 파일

주요 반영 파일:

- `back/accounts/models.py`
- `back/accounts/managers.py`
- `back/accounts/admin.py`
- `back/accounts/serializers.py`
- `back/accounts/views.py`
- `back/accounts/urls.py`
- `back/accounts/migrations/0001_initial.py`
- `back/accounts/migrations/0002_alter_user_managers.py`
- `back/profiles/models.py`
- `back/profiles/serializers.py`
- `back/profiles/admin.py`
- `back/profiles/migrations/0001_initial.py`
- `back/config/settings.py`
- `back/config/urls.py`
- `back/requirements.txt`
