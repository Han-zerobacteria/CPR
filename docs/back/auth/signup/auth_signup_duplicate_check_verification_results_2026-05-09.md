# CPR 회원가입 중복체크 검증 결과

## 1. 검증 일시

- 날짜: 2026-05-09
- 환경: Docker Compose 개발 환경
- 백엔드: Django 5.2.12
- DB: PostgreSQL 16

## 2. 검증 대상

오늘 검증한 대상은 다음과 같다.

- `GET /api/auth/check-login-id/`
- `GET /api/auth/check-nickname/`
- `SignupView.as_view()` 오류 수정
- Django URL 로딩
- Django system check
- Python 문법 검사

## 3. 발생 오류

백엔드 컨테이너 기동 중 다음 오류가 발생했다.

```txt
AttributeError: 'function' object has no attribute 'as_view'
```

오류 발생 위치:

```txt
/app/accounts/urls.py
path('signup/', SignupView.as_view(), name='auth-signup')
```

## 4. 오류 원인

`SignupView`는 `APIView` 기반 클래스형 view인데, 함수형 view 전용 데코레이터가 붙어 있었다.

문제 형태:

```py
@api_view(["POST"])
@permission_classes([AllowAny])
@parser_classes([MultiPartParser, FormParser, JSONParser])
class SignupView(APIView):
    ...
```

`@api_view`는 함수형 view를 만들기 위한 데코레이터이므로 클래스에 적용하면 `SignupView`가 함수 객체처럼 바뀐다.

그 결과 `urls.py`에서 다음 호출이 실패했다.

```py
SignupView.as_view()
```

## 5. 오류 조치

함수형 view 전용 데코레이터를 제거했다.

제거한 항목:

- `@api_view(["POST"])`
- `@permission_classes([AllowAny])`
- `@parser_classes([MultiPartParser, FormParser, JSONParser])`

클래스형 view 방식으로 설정을 옮겼다.

```py
@extend_schema(tags=["accounts"], request=SignupSerializer)
class SignupView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]
```

결과:

- `SignupView.as_view()` 정상 동작
- Django URL 로딩 오류 해결

## 6. 중복체크 API 추가 내용

추가한 API:

```txt
GET /api/auth/check-login-id/?login_id={login_id}
GET /api/auth/check-nickname/?nickname={nickname}
```

추가한 view:

```py
CheckLoginIdView
CheckNicknameView
```

추가한 route:

```py
path("check-login-id/", CheckLoginIdView.as_view(), name="auth-check-login-id")
path("check-nickname/", CheckNicknameView.as_view(), name="auth-check-nickname")
```

## 7. 공통 검증 함수 추가

`SignupSerializer`와 중복체크 API가 같은 형식 검증을 사용하도록 공통 함수를 추가했다.

```py
validate_login_id_format(value)
validate_nickname_format(value)
```

검증 패턴:

```py
LOGIN_ID_PATTERN = re.compile(r"^[a-z][a-z0-9_]{3,19}$")
NICKNAME_PATTERN = re.compile(r"^[가-힣A-Za-z0-9_.]{2,20}$")
```

## 8. Python 문법 검사

명령:

```txt
python3 -m py_compile back/accounts/views.py back/accounts/urls.py
```

결과:

```txt
성공
```

출력:

```txt
오류 없음
```

판정:

- Python 문법 오류 없음

## 9. Docker 컨테이너 상태

수정 전에는 back 컨테이너가 이전 오류로 재시작 루프에 있었다.

명령:

```txt
docker compose exec -T back python manage.py check
```

초기 결과:

```txt
Container ... is restarting, wait until the container is running
```

조치:

```txt
docker compose restart back
```

결과:

- back 컨테이너 재시작 완료
- 수정된 코드 반영

## 10. Django 로그 확인

재시작 후 백엔드 로그에서 다음 내용을 확인했다.

```txt
Operations to perform:
  Apply all migrations: accounts, admin, auth, contenttypes, profiles, sessions, token_blacklist
Running migrations:
  No migrations to apply.
Watching for file changes with StatReloader
Performing system checks...
System check identified no issues (0 silenced).
Starting development server at http://0.0.0.0:8000/
```

판정:

- Django URL 로딩 성공
- system check 성공
- 개발 서버 정상 시작

## 11. Django System Check

명령:

```txt
docker compose exec -T back python manage.py check
```

결과:

```txt
System check identified no issues (0 silenced).
```

판정:

- 성공

## 12. 중복체크 API 검증

검증 방식:

- 컨테이너 내부 Django test client 사용
- `SERVER_NAME='localhost'` 지정

### 12.1 login_id 중복체크

요청:

```txt
GET /api/auth/check-login-id/?login_id=cpr_user01
```

결과:

```txt
200 {'available': False}
```

판정:

- 이미 존재하는 `login_id`에 대해 `available: false` 반환
- 성공

### 12.2 nickname 중복체크

요청:

```txt
GET /api/auth/check-nickname/?nickname=testnick
```

결과:

```txt
200 {'available': True}
```

판정:

- 사용 가능한 `nickname`에 대해 `available: true` 반환
- 성공

## 13. 최종 판정

오늘 작업한 회원가입 중복체크 기능은 다음 기준을 만족한다.

- `login_id` 사전 중복체크 API 추가 완료
- `nickname` 사전 중복체크 API 추가 완료
- signup 저장 시점 중복 검증 유지
- signup과 중복체크 API가 같은 형식 검증 함수 사용
- `SignupView.as_view()` 오류 해결
- Django system check 통과
- 중복체크 API 응답 검증 완료

## 14. 남은 후속 작업

프론트엔드 회원가입 화면에서 다음 UI/UX를 연결해야 한다.

- `login_id` 입력 후 중복확인 버튼 또는 blur 이벤트 연결
- `nickname` 입력 후 중복확인 버튼 또는 blur 이벤트 연결
- `available: true`일 때 사용 가능 메시지 표시
- `available: false`일 때 중복 메시지 표시
- `400` 응답일 때 형식 오류 메시지 표시
- 최종 signup 요청 실패 시 서버 오류 메시지 표시
