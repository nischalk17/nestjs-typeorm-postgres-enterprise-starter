<h1 align="center">🚀 NestJS Enterprise Starter</h1>

<p align="center">
  A production-grade, reusable NestJS + TypeORM + PostgreSQL backend starter with
  Bearer JWT auth (access + refresh), RBAC, mail, uploads, config validation,
  seeding, Docker, CI, and developer tooling.
</p>

---

## Overview

This starter is a batteries-included foundation for building backend APIs
(e-commerce, LMS, SaaS, admin portals, multi-tenant services). It ships with the
patterns you would otherwise re-implement on every project: authentication,
authorization, request/response standardization, structured logging,
configuration validation, database migrations & seeding, containerization, and
CI/quality gates.

## Features

- **Bearer JWT authentication** with short-lived access tokens and long-lived,
  DB-stored (bcrypt-hashed) refresh tokens. Passport `JwtStrategy` /
  `JwtRefreshStrategy`.
- **Global guards** (`JwtAuthGuard` then `RolesGuard`) via `APP_GUARD` with a
  `@Public()` decorator to exempt routes and a `@Roles()` decorator for RBAC.
- **Standard response envelope** and **canonical error shape**
  (`{ success, statusCode, message, errors, path, timestamp }`).
- **Pagination** helpers with a consistent `meta` object.
- **Request logging** interceptor + Winston (daily-rotate file) logging, with a
  per-request **correlation/request id** (`X-Request-Id`, echoed in the
  response header and included in log lines).
- **Defense-in-depth serialization** — a global `ClassSerializerInterceptor`
  strips `@Exclude()`-marked entity fields (password, refresh-token hash) from
  every response, on top of the existing `select: false` columns.
- **Compression**, explicit **request body size limits** (10MB), and a global
  **request timeout interceptor** (408 after 30s) guard against slow/oversized
  requests.
- **Config module** split into namespaced `registerAs()` factories with
  fail-fast **Joi** env validation.
- **Uploads** module with env-driven Multer config and a reusable `saveFile()`.
- **Mail** module (Nodemailer + Handlebars templates), welcome email on register.
- **Throttling** (config-driven) with stricter limits on `/auth/login` &
  `/auth/refresh`.
- **API URI versioning** — routes are served under `/api/v1/...`.
- **Health checks** (Terminus): combined `GET /health`, plus dedicated
  **liveness** (`GET /health/live`, process/memory only) and **readiness**
  (`GET /health/ready`, includes DB ping) probes for orchestrators. Also
  **graceful shutdown**.
- **Database** migrations, seeds and factories.
- **Docker** (multi-stage, non-root) + **docker-compose** (app + Postgres).
- **CI** (GitHub Actions) + **Husky** + **lint-staged** + **commitlint**.
- Commented-out **Redis cache** / **BullMQ queue** scaffolding.

## Architecture

```
src/
  common/            # cross-cutting building blocks
    constants/ decorators/ dto/ enums/ exceptions/ filters/
    guards/ interceptors/ interfaces/ logger/ types/ utils/
    base.entity.ts
  config/            # registerAs() factories + Joi env validation
    app / database / jwt / mail / upload / throttle / redis .config.ts
    env.validation.ts
  database/          # data source, migrations, seeds, factories
    typeorm.config.ts  data-source.options.ts
    migrations/ seeds/ factories/
  modules/           # feature modules
    auth/ users/ uploads/ mail/ health/
  app.module.ts
  main.ts
```

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm

## Installation

```bash
npm install
cp .env.example .env   # then edit values
```

## Environment

All variables are documented in [`.env.example`](./.env.example). Required vars
(`DB_*`, `JWT_SECRET`) are validated at startup — the app fails fast if any are
missing or invalid. Notable additions vs. a bare Nest app:

| Var                                             | Purpose                                                                                                          |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `JWT_SECRET` / `JWT_EXPIRATION`                 | Access token secret / TTL (default 15m)                                                                          |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRATION` | Refresh token secret / TTL (default 7d)                                                                          |
| `BCRYPT_ROUNDS`                                 | bcrypt cost factor (default 12)                                                                                  |
| `MAIL_*`                                        | SMTP host/port/user/pass/from for Nodemailer                                                                     |
| `UPLOAD_*`                                      | Upload dir, max size (MB), allowed MIME types                                                                    |
| `THROTTLE_*`                                    | Rate-limit enable/ttl/limit                                                                                      |
| `DB_SSL` / `DB_SSL_REJECT_UNAUTHORIZED`         | SSL (auto-on in prod, rejects self-signed by default)                                                            |
| `CORS_ORIGINS`                                  | Comma-separated allow-list. Supports the literal `*` (allow any origin), and `*.example.com` subdomain wildcards |
| `NGROK_ORIGIN`                                  | One extra origin always allowed regardless of `CORS_ORIGINS` (e.g. a rotating local tunnel URL)                  |

## Database: migrations & seeding

```bash
# Generate a migration from entity changes
npm run typeorm:generate --name=CreateUsers

# Apply / revert migrations
npm run typeorm:run
npm run typeorm:revert

# Seed a default admin user (uses SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD)
npm run db:seed
```

`synchronize` is disabled everywhere — always use migrations.

## Running locally

```bash
npm run start:dev      # watch mode
npm run start          # normal
npm run build && npm run start:prod
```

App listens on `PORT` (default `9095`). Base URL: `http://localhost:9095/api/v1`.

## Docker

```bash
cp .env.example .env   # set DB_* etc. (compose overrides DB_HOST to `postgres`)
docker-compose up --build
```

This starts the app and a Postgres instance, with named volumes for uploads,
logs and DB data.

## Authentication flow

1. `POST /api/v1/auth/register` or `POST /api/v1/auth/login`
   → returns `{ accessToken, refreshToken }`.
2. Send the access token on protected routes:
   `Authorization: Bearer <accessToken>`.
3. When the access token expires, call `POST /api/v1/auth/refresh` with the
   **refresh token** as the Bearer token → returns a fresh token pair.
4. `POST /api/v1/auth/logout` (access token) revokes the stored refresh hash.

User registration (write + refresh-token persistence) runs inside a single
DB transaction, so a mid-registration failure never leaves an orphaned user
row without a usable refresh token; the welcome email is sent afterwards,
fire-and-forget, and never rolls back a successful registration.

Public routes (`register`, `login`, `refresh`, `health*`) are marked `@Public()`.
`GET /api/v1/users/all` (admin/super-admin only) is paginated (`page`, `take`,
`search`, `sortBy`, `sortOrder`, `role` query params) via the shared
`PaginationDto`. Non-admin callers get `403 Forbidden` if they try to read or
update another user's record via `GET/PATCH /api/v1/users/:id` — only their own
`:id` or `/users/profile` is allowed. Unique-constraint violations from the
database (e.g. duplicate email) are mapped by the global exception filter to a
`409 Conflict` with the standard error envelope, not a raw `500`.

## Swagger

In non-production, interactive docs are served at **`/docs`** with Bearer auth
(click _Authorize_ and paste an access token).

## Developer workflow

- `npm run lint` — ESLint (auto-fix)
- `npm test` — Jest unit tests
- **Husky** runs `lint-staged` on pre-commit and **commitlint**
  (Conventional Commits) on commit-msg. Example: `feat: add refresh flow`.

## Deployment

1. Build the image (`docker build`) or run `npm run build`.
2. Provide production env vars (strong secrets, `NODE_ENV=production`).
3. Run migrations (`npm run typeorm:run`), optionally `npm run db:seed`.
4. Start `node dist/main.js` (or the container). SSL to Postgres is enabled
   automatically in production.

## Troubleshooting

- **App exits on boot with a config error** — a required env var is missing/invalid;
  the Joi validator prints the offending keys.
- **DB SSL errors on managed Postgres** — set `DB_SSL_REJECT_UNAUTHORIZED=false`.
- **401 on every request** — ensure `Authorization: Bearer <accessToken>` is set;
  the route may not be `@Public()`.
- **Emails not sending** — check `MAIL_*` vars; mail failures are logged and
  never block registration (fire-and-forget).
- **Enabling Redis cache / BullMQ** — follow the commented instructions in
  `src/app.module.ts` and `src/config/redis.config.ts`.
