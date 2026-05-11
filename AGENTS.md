# CPR Agent Guide

This file is the operating guide for coding agents working in this repository.

## Project Shape

- Product: CPR (Cloth Personal Rescue), a clothing coordination and closet service.
- Frontend: `front/`, Next.js 16, React 19, TypeScript, Tailwind CSS.
- Backend: `back/`, Django 5.2, Django REST Framework, Simple JWT, PostgreSQL.
- Local orchestration: `docker-compose.yml` starts `db`, `back`, and `front`.
- Requirements and verification notes live under `docs/`.

## Working Principles

- Keep changes small and scoped to the requested feature or bug.
- Prefer existing project patterns over introducing new abstractions.
- Do not commit secrets. `.env` and `*.env` are ignored; use `*.env.example` for templates.
- Do not rewrite migrations casually. Add new migrations for model changes.
- Keep API behavior explicit in serializers/views and document meaningful contract changes in `docs/`.
- For UI work, build the actual user workflow first. Avoid landing-page filler unless explicitly requested.

## Common Commands

From the repository root:

```bash
docker compose up --build
```

Frontend:

```bash
cd front
npm install
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```

Backend:

```bash
cd back
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py check
python manage.py test
python manage.py runserver 0.0.0.0:8000
```

## Validation Expectations

- Frontend changes should pass `npm run lint`; run `npx tsc --noEmit` for TypeScript surface changes.
- Backend changes should at least pass `python -m compileall -q back`; run `python manage.py check` and `python manage.py test` when Django dependencies and env are available.
- Full-stack changes should be smoke-tested with `docker compose up --build` when possible.
- Authentication changes need extra care around JWT rotation, blacklist behavior, cookie path, SameSite, and CORS settings.

## Pre-Commit Hook

The versioned hook template is at `scripts/hooks/pre-commit`.

Install or refresh the local Git hook with:

```bash
cp scripts/hooks/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

The hook runs only relevant checks based on staged paths and skips dependency-heavy checks when local dependencies are not installed.

## Directory Notes

- `front/src/app/`: App Router pages, layout, and global styles.
- `back/accounts/`: Custom user model, auth endpoints, serializers, and managers.
- `back/profiles/`: User profile model and related API surface.
- `back/config/`: Django settings, URLs, ASGI/WSGI entry points.
- `docs/auth/`: Auth-related requirements and verification records.

## Review Checklist

- Are migrations included for model changes?
- Are serializer validation errors clear and stable?
- Are auth cookies and CORS settings compatible with the frontend origin?
- Does the UI handle loading, error, empty, and success states?
- Are generated or build artifacts excluded from commits?
- Did the change avoid unrelated formatting churn?
