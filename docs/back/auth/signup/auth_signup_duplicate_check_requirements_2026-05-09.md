# CPR 회원가입 중복체크 반영 요구사항 정의서

# 26/05/09

## 1. 문서 목적

본 문서는 2026-05-09에 반영한 CPR 회원가입 중복체크 API와 관련 오류 수정 요구사항을 정리한다.

대상 범위:

- `login_id` 중복체크
- `nickname` 중복체크
- signup 저장 시점 중복 검증 유지
- 클래스형 view와 함수형 view 데코레이터 혼용 방지

## 2. 배경

회원가입 화면에서 사용자가 최종 제출하기 전에 `login_id`와 `nickname` 사용 가능 여부를 확인할 수 있어야 한다.

기존 `SignupSerializer`에는 회원가입 저장 시점의 중복 검증이 있었지만, 프론트엔드에서 입력 중 사전 확인할 수 있는 별도 API는 없었다.

따라서 다음 두 API를 추가한다.

```txt
GET /api/accounts/check-login-id/?login_id={login_id}
GET /api/accounts/check-nickname/?nickname={nickname}
```

## 3. login_id 중복체크 요구사항

Endpoint:

```txt
GET /api/accounts/check-login-id/
```

Query parameter:

```txt
login_id
```

검증 조건:

- 필수값
- 4자 이상 20자 이하
- 영문 소문자로 시작
- 영문 소문자, 숫자, `_`만 허용
- 대문자 허용하지 않음
- `accounts_user.login_id` 기준 중복 확인

성공 응답:

```json
{
  "available": true
}
```

이미 사용 중인 경우:

```json
{
  "available": false
}
```

값이 없거나 형식이 잘못된 경우:

```json
{
  "available": false,
  "detail": "error message"
}
```

Status:

- 정상 조회: `200 OK`
- 값 누락 또는 형식 오류: `400 Bad Request`

## 4. nickname 중복체크 요구사항

Endpoint:

```txt
GET /api/accounts/check-nickname/
```

Query parameter:

```txt
nickname
```

검증 조건:

- 필수값
- 2자 이상 20자 이하
- 한글, 영문, 숫자, `_`, `.` 허용
- 공백 금지
- 앞뒤 공백 금지
- `profiles_profile.nickname` 기준 중복 확인
- 대소문자 구분 없이 중복 확인

성공 응답:

```json
{
  "available": true
}
```

이미 사용 중인 경우:

```json
{
  "available": false
}
```

값이 없거나 형식이 잘못된 경우:

```json
{
  "available": false,
  "detail": "error message"
}
```

Status:

- 정상 조회: `200 OK`
- 값 누락 또는 형식 오류: `400 Bad Request`

## 5. Signup 저장 시점 검증 유지

중복체크 API는 사용자 편의를 위한 사전 확인 기능이다.

회원가입 최종 저장 시점에도 반드시 `SignupSerializer`에서 다음 검증을 다시 수행한다.

- `login_id` 형식 검증
- `login_id` 중복 검증
- `nickname` 형식 검증
- `nickname` 중복 검증

이유:

- 중복체크 후 다른 사용자가 같은 값을 먼저 가입할 수 있음
- 클라이언트가 중복체크 API를 호출하지 않고 signup 요청을 보낼 수 있음
- DB unique constraint와 serializer 검증을 함께 사용해야 race condition을 줄일 수 있음

## 6. 검증 로직 재사용

중복체크 API와 signup serializer의 형식 검증이 서로 달라지면 프론트엔드에서 혼란이 발생한다.

따라서 다음 검증 함수를 공통으로 사용한다.

```py
validate_login_id_format(value)
validate_nickname_format(value)
```

적용 위치:

- `SignupSerializer.validate_login_id`
- `SignupSerializer.validate_nickname`
- `CheckLoginIdView`
- `CheckNicknameView`

## 7. URL 라우팅

`accounts.urls`에 다음 route를 추가한다.

```py
path("check-login-id/", CheckLoginIdView.as_view(), name="accounts-check-login-id")
path("check-nickname/", CheckNicknameView.as_view(), name="accounts-check-nickname")
```

## 8. View 구현 방식

현재 인증 API는 `APIView` 기반 클래스형 view를 사용한다.

따라서 중복체크 API도 다음과 같이 클래스형 view로 구현한다.

```py
class CheckLoginIdView(APIView):
    permission_classes = [AllowAny]

class CheckNicknameView(APIView):
    permission_classes = [AllowAny]
```

## 9. SignupView 데코레이터 정책

`SignupView`는 `APIView` 기반 클래스형 view이다.

함수형 view 전용 데코레이터는 사용하지 않는다.

사용 금지:

```py
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([...])
class SignupView(APIView):
    ...
```

이유:

- `@api_view`는 함수형 view를 만들기 위한 데코레이터이다.
- 클래스에 붙이면 `SignupView`가 함수 객체로 변환된다.
- `urls.py`에서 `SignupView.as_view()` 호출 시 오류가 발생한다.

올바른 방식:

```py
@extend_schema(tags=["accounts"], request=SignupSerializer)
class SignupView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
```

## 10. 반영 파일

오늘 작업에서 반영된 주요 파일:

- `back/accounts/serializers.py`
- `back/accounts/views.py`
- `back/accounts/urls.py`

## 11. 후속 작업

프론트엔드 회원가입 화면에서 다음 흐름을 연결한다.

```txt
login_id 입력
-> check-login-id 호출
-> available 결과 표시

nickname 입력
-> check-nickname 호출
-> available 결과 표시

signup 제출
-> 서버에서 최종 검증 후 가입 처리
```

중복체크 결과는 UX 보조 정보로만 사용하고, 최종 성공 여부는 signup API 응답을 기준으로 처리한다.
