# CareOps FastAPI Backend

This is the initial FastAPI scaffold for the hybrid CareOps architecture.

## Quick Start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/health` for the health check.
Open `http://localhost:8000/api/v1/health/db` for database connectivity status.
Open `http://localhost:8000/api/v1/health/redis` for Redis connectivity status.

Set `DATABASE_URL` with async SQLAlchemy format, for example:

`postgresql+asyncpg://user:password@host/database`

Set `REDIS_URL` (Upstash or local Redis), for example:

`redis://localhost:6379/0`

## Clerk Auth (Backend)

Set these environment variables before testing protected routes:

- `CLERK_JWKS_URL`
- `CLERK_ISSUER`
- `CLERK_AUDIENCE` (optional)

Protected endpoint:

- `GET /api/v1/protected/me` with `Authorization: Bearer <token>`

## Alembic Migrations

With `DATABASE_URL` set, generate and apply migrations:

```bash
alembic revision --autogenerate -m "init"
alembic upgrade head
```
