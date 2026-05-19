# CPR 인증 및 회원가입 검증 결과

## 1. 검증 일시

- 날짜: 2026-05-06
- 환경: Docker Compose 개발 환경
- 백엔드: Django 5.2.12
- DB: PostgreSQL 16

## 2. 검증 대상

이번 검증 대상은 다음 기능이다.

- 커스텀 User 모델 로딩
- Profile 앱 로딩
- 마이그레이션 적용
- Django system check
- 회원가입 API
- 로그인 API
- refresh token cookie 설정
- 모델과 migration 동기화 상태

## 3. 발생했던 문제와 조치

### 3.1 AUTH_USER_MODEL 앱 라벨 오류

초기 에러:

```txt
django.core.exceptions.ImproperlyConfigured:
AUTH_USER_MODEL refers to model 'account.User' that has not been installed
```

원인:

```python
AUTH_USER_MODEL = "account.User"
```

실제 앱 이름은 `accounts`였으므로 앱 라벨이 일치하지 않았다.

조치:

```python
AUTH_USER_MODEL = "accounts.User"
```

결과:

- 해당 에러 해결

### 3.2 profiles 앱 미등록

원인:

- `profiles` 앱 파일은 추가됐지만 `INSTALLED_APPS`에 등록되어 있지 않았다.

조치:

```python
INSTALLED_APPS = [
    ...
    "accounts",
    "profiles",
]
```

결과:

- Profile 모델 로딩 가능
- Profile migration 적용 가능

### 3.3 Pillow 미설치

초기 에러:

```txt
profiles.Profile.profile_image: (fields.E210)
Cannot use ImageField because Pillow is not installed.
```

원인:

- `ImageField` 사용에 필요한 Pillow dependency가 없었다.

조치:

```txt
Pillow==12.0.0
```

를 `back/requirements.txt`에 추가하고 백엔드 Docker 이미지를 재빌드했다.

결과:

- `ImageField` system check 통과

### 3.4 기존 개발 DB migration 순서 충돌

초기 에러:

```txt
django.db.migrations.exceptions.InconsistentMigrationHistory:
Migration admin.0001_initial is applied before its dependency accounts.0001_initial
```

원인:

- 기존 개발 DB에 Django 기본 auth/admin migration이 이미 적용된 상태에서 커스텀 User를 도입했다.
- 커스텀 User는 프로젝트 초기에 적용되어야 migration 순서가 안정적이다.

조치:

```txt
docker compose down -v
docker compose up -d
```

개발용 PostgreSQL volume을 초기화했다.

결과:

- 새 DB에서 migration 순서 정상 적용

주의:

- 이 조치는 개발 DB 데이터를 삭제한다.
- 운영 DB 또는 보존해야 하는 데이터가 있는 환경에서는 별도 migration 전략이 필요하다.

## 4. Docker 이미지 빌드 검증

명령:

```txt
docker compose build back
```

결과:

```txt
back  Built
```

확인 내용:

- `requirements.txt` 반영
- Pillow 설치 완료
- 백엔드 이미지 빌드 성공

## 5. 서비스 기동 검증

명령:

```txt
docker compose up -d
```

결과:

```txt
cpr-db     Up
cpr-back   Up
cpr-front  Up
```

백엔드 로그 주요 결과:

```txt
Applying accounts.0001_initial... OK
Applying profiles.0001_initial... OK
Applying accounts.0002_alter_user_managers... OK
System check identified no issues (0 silenced).
Starting development server at http://0.0.0.0:8000/
```

## 6. Migration 검증

명령:

```txt
docker compose exec -T back python manage.py migrate
```

결과:

```txt
Operations to perform:
  Apply all migrations: accounts, admin, auth, contenttypes, profiles, sessions, token_blacklist

Running migrations:
  Applying accounts.0002_alter_user_managers... OK
```

최종 migration 동기화 확인:

```txt
docker compose exec -T back python manage.py makemigrations --check --dry-run
```

결과:

```txt
No changes detected
```

## 7. Django System Check 검증

명령:

```txt
docker compose exec -T back python manage.py check
```

결과:

```txt
System check identified no issues (0 silenced).
```

## 8. 회원가입 API 검증

검증 방식:

- 컨테이너 내부 Django test client 사용
- `SERVER_NAME='localhost'`로 요청

요청:

```json
{
  "login_id": "cpr_user01",
  "password": "password123!",
  "confirm_password": "password123!",
  "nickname": "옷잘입는_민수",
  "bio": "편한 스트릿룩을 좋아해요"
}
```

결과 status:

```txt
201
```

응답 body:

```json
{
  "accessToken": "jwt-access-token",
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

Cookie 검증:

```txt
refresh_token cookie 존재: True
```

판정:

- 성공

## 9. 로그인 API 검증

요청:

```json
{
  "login_id": "cpr_user01",
  "password": "password123!"
}
```

결과 status:

```txt
200
```

응답 body:

```json
{
  "accessToken": "jwt-access-token",
  "user": {
    "id": 1,
    "login_id": "cpr_user01"
  }
}
```

Cookie 검증:

```txt
refresh_token cookie 존재: True
```

판정:

- 성공

## 10. 호스트 curl 검증 이슈

호스트에서 다음 요청은 실패했다.

```txt
curl -i -X POST http://127.0.0.1:8000/api/auth/signup/
```

결과:

```txt
curl: (7) Failed to connect to 127.0.0.1 port 8000
```

동시에 Docker Compose 기준 포트 매핑은 정상으로 표시되었다.

```txt
0.0.0.0:8000->8000/tcp
```

판정:

- 컨테이너 내부 Django test client 검증은 성공
- 현재 Codex 실행 환경에서 호스트 curl이 Docker published port에 접근하지 못한 것으로 보임
- 로컬 브라우저 또는 일반 터미널에서는 별도 확인 필요

## 11. 최종 판정

현재 백엔드 인증 및 회원가입 구현은 다음 기준을 만족한다.

- 커스텀 User 모델 정상 로딩
- Profile 모델 정상 로딩
- 회원가입 시 User/Profile 동시 생성
- 회원가입 성공 시 즉시 로그인 처리
- refresh token httpOnly cookie 설정
- `role`은 `general_user` 기본값으로 고정
- 닉네임 필수 제약 반영
- 로컬 프로필 이미지 저장 설정 반영
- Django system check 통과
- migration 동기화 확인 완료

남은 후속 작업:

- 프론트엔드 signup/login 화면 연결
- Axios/Zustand 인증 상태 관리 구현
- Access Token refresh interceptor 구현
- 실제 브라우저 환경에서 cookie 및 CORS 동작 확인
- 프로필 이미지 multipart 업로드 E2E 검증
