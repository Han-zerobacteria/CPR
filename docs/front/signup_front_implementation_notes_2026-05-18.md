# Signup Front Implementation Notes

Date: 2026-05-18

## Scope

Implemented the first CPR signup frontend flow for `/signup` based on the signup page requirements.

The work covers:

- Mobile-first signup form UI.
- Client-side validation for `login_id`, `password`, `confirm_password`, `nickname`, `profile_image`, and `bio`.
- Automatic duplicate checks for `login_id` and `nickname` on blur.
- Duplicate check state reset when the related input changes.
- Loading, success, and error states for duplicate checks.
- Multipart signup request with optional profile image upload.
- Profile image extension validation and preview via `URL.createObjectURL`.
- Signup success session mapping into the frontend auth store.
- Login page link from the signup form.

## Changed Frontend Structure

```txt
front/src/app/(public)/signup/page.tsx
front/src/features/auth/api/signup-api.ts
front/src/features/auth/components/SignupForm.tsx
front/src/features/auth/components/ProfileImageUploader.tsx
front/src/features/auth/model/signup-types.ts
front/src/features/auth/model/signup-validation.ts
front/src/lib/axios/api-client.ts
```

## API Contract Used

```txt
POST /api/accounts/signup/
GET /api/accounts/check-login-id/?login_id=value
GET /api/accounts/check-nickname/?nickname=value
```

Signup is sent as `multipart/form-data` so the optional `profile_image` can be uploaded with the account fields.

## Important Implementation Notes

- `apiClient` now skips the default `Content-Type: application/json` header when the request body is `FormData`.
- `apiClient` now throws `ApiError` with parsed response data so field-level server errors can be mapped in the signup form.
- Frontend `login_id` validation follows the backend rule: lowercase letter first, then lowercase letters, numbers, or `_`, 4-20 characters total.
- Frontend `nickname` validation follows the backend rule: Korean, letters, numbers, `_`, or `.`, 2-20 characters.
- `bio` is capped at 30 characters to match the backend serializer.
- Late duplicate-check responses are ignored when the user has already changed the input value.

## Profile Image Storage

The frontend only previews and submits the image. Actual storage is handled by Django `ImageField`.

Current backend storage path:

```txt
back/media/profiles/{user_id}/{filename}
```

Current media settings:

```py
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
```

In Docker, media persistence depends on volume configuration. Without a persistent media volume or remote object storage, uploaded images can be lost when containers are recreated.

## Risks And Follow-Ups

- Server error messages are currently displayed mostly as returned by the backend, so localization may need a later pass.
- Docker media persistence should be decided before relying on profile image uploads in a shared environment.
- A future S3/CloudFront or presigned upload path should replace local media storage for production.
- The login page is still placeholder-level and does not yet share form components with signup.

## Validation

Passed on 2026-05-18:

```bash
cd front
npm run lint
npx tsc --noEmit
```
