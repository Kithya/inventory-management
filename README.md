# Inventory Management

A production-oriented inventory management web application with a Next.js frontend, an Express API, Prisma, Neon Postgres, and invite-only local authentication.

The project is organized as two separate applications:

- `client`: Next.js frontend for dashboard, inventory, products, expenses, users, and auth screens.
- `server`: Express API for data access, authentication, authorization, health checks, and API docs.

## Project Overview

This application helps teams manage products, stock levels, expenses, users, and dashboard metrics. It is designed as a real application rather than a public demo: authentication is required, public signup is disabled, and new users join through admin-created invites.

The first admin is created with a one-time bootstrap invite script. After that, admins invite future users from the Users page.

## Features

- Invite-only local authentication with no public signup.
- Admin bootstrap flow for the first account.
- Login, logout, refresh session, invite acceptance, forgot password, and reset password flows.
- Role-based access for admin-only actions.
- Product inventory list with search, sorting, filtering, pagination, and product creation.
- Dashboard metrics for products, sales, purchases, and expenses.
- Expense category summaries and filtering.
- User list and invite management for admins.
- Health, readiness, and Swagger API documentation endpoints.
- Request validation, structured errors, rate limiting, Helmet, CORS allowlist, and request logging.

## Tech Stack

Frontend:

- Next.js 16
- React 19
- TypeScript
- Redux Toolkit Query
- Tailwind CSS
- Recharts
- React Hook Form and Zod

Backend:

- Node.js
- Express 5
- TypeScript
- Prisma 7
- Neon Postgres
- Argon2id password hashing
- JWT access tokens with rotating refresh-token sessions
- Zod validation
- Pino HTTP logging
- Swagger UI

## Repository Structure

```text
inventory_management/
  client/                 Next.js frontend
  server/                 Express API
    prisma/               Prisma schema, migrations, and seed data
    src/                  API source code
      controllers/        Request handlers
      lib/                Auth, env, Prisma, security, and error helpers
      routes/             Express route modules
      scripts/            Operational scripts
```

There is no root package script. Run frontend and backend commands from their own folders.

## Prerequisites

- Node.js 20 or newer recommended.
- npm.
- A Neon Postgres database.
- Two terminals for local development: one for `server`, one for `client`.

## Environment Variables

### Server

Create `server/.env` from `server/.env.example`.

```powershell
cd server
Copy-Item .env.example .env
```

Required server variables:

```env
NODE_ENV=development
PORT=8000

DATABASE_URL=postgresql://USER:PASSWORD@HOST-pooler.REGION.aws.neon.tech/DB?sslmode=require
DIRECT_URL=postgresql://USER:PASSWORD@HOST.REGION.aws.neon.tech/DB?sslmode=require

CLIENT_ORIGINS=http://localhost:3000
APP_URL=http://localhost:3000
AUTH_REQUIRED=false

JWT_ACCESS_SECRET=change-this-development-secret-with-64-random-characters
ACCESS_TOKEN_TTL_MINUTES=15
REFRESH_TOKEN_TTL_DAYS=7
REFRESH_COOKIE_NAME=inventory_refresh
INVITE_TOKEN_TTL_DAYS=7
RESET_TOKEN_TTL_MINUTES=30
```

Use Neon's pooled hostname for `DATABASE_URL` in app runtime traffic. Use the direct hostname for `DIRECT_URL` so Prisma CLI operations can run migrations and introspection safely.

For production, set `AUTH_REQUIRED=true` and use a strong `JWT_ACCESS_SECRET` with at least 32 characters.

### Client

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

This is the API base URL used by RTK Query and the auth provider.

## Database Setup

Install dependencies first:

```powershell
cd server
npm install
```

Generate the Prisma client:

```powershell
npx prisma generate
```

Apply existing migrations:

```powershell
npx prisma migrate deploy
```

For local development where you are actively creating new migrations, use:

```powershell
npx prisma migrate dev
```

Optional development seed:

```powershell
npm run seed
```

The seed command clears and recreates development data. Seed users are development records only and do not have usable local passwords. Use the invite flow to create real login accounts.

## Local Development

Install backend dependencies:

```powershell
cd server
npm install
```

Install frontend dependencies:

```powershell
cd ../client
npm install
```

Start the backend:

```powershell
cd ../server
npm run dev
```

Start the frontend in a second terminal:

```powershell
cd client
npm run dev
```

Common local URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`
- Health check: `http://localhost:8000/healthz`
- Readiness check: `http://localhost:8000/readyz`

## Authentication Setup

This project uses invite-only local authentication.

Rules:

- There is no public signup.
- The first admin is created through a bootstrap invite.
- Admins invite all future users from the Users page.
- Access tokens are short-lived and stored only in frontend memory.
- Refresh tokens are stored as rotating, hashed database sessions.
- The raw refresh token is stored only in an HttpOnly cookie.
- Passwords are hashed with Argon2id.

Create the first admin invite:

```powershell
cd server
npm run auth:create-admin -- owner@example.com "Owner"
```

Open the printed `/accept-invite?token=...` link in the browser and set the first admin password. After logging in, use the Users page to invite additional admins or standard users.

If an active admin with a password already exists, the bootstrap command refuses to create another admin. Create future admins through the app instead.

## API Overview

Public utility endpoints:

- `GET /healthz`
- `GET /readyz`
- `GET /openapi.json`
- `GET /docs`

Auth endpoints:

- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/accept-invite`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

Protected app endpoints:

- `GET /dashboard`
- `GET /products`
- `POST /products` admin only
- `GET /expenses`
- `GET /users` admin only
- `GET /users/invites` admin only
- `POST /users/invites` admin only
- `DELETE /users/invites/:inviteId` admin only

Detailed API documentation is available at `http://localhost:8000/docs` when the backend is running.

## Scripts

Server scripts:

```powershell
cd server
npm run dev
npm run build
npm start
npm test
npm run seed
npm run auth:create-admin -- owner@example.com "Owner"
```

Client scripts:

```powershell
cd client
npm run dev
npm run build
npm start
npm run lint
```

## Production Deployment Notes

Server:

- Set `NODE_ENV=production`.
- Set `AUTH_REQUIRED=true`.
- Use a long, random `JWT_ACCESS_SECRET`.
- Set `APP_URL` to the deployed frontend URL.
- Set `CLIENT_ORIGINS` to the exact allowed frontend origin or origins.
- Use Neon's pooled connection URL for `DATABASE_URL`.
- Use Neon's direct connection URL for `DIRECT_URL`.
- Run `npx prisma migrate deploy` during deployment.
- Serve the API over HTTPS so secure refresh cookies work correctly.
- Do not rely on seed users for production access.

Client:

- Set `NEXT_PUBLIC_API_BASE_URL` to the deployed API origin.
- Build with `npm run build`.
- Start with `npm start` or deploy through a Next.js-compatible platform.

Operational endpoints:

- Use `/healthz` for process liveness.
- Use `/readyz` for database readiness.
- Use `/docs` for API exploration in trusted environments.

## Troubleshooting

`Missing required email` when creating the first admin:

- Use the positional command format:
  ```powershell
  npm run auth:create-admin -- owner@example.com "Owner"
  ```

Login succeeds but protected API requests fail:

- Confirm `NEXT_PUBLIC_API_BASE_URL` points to the backend.
- Confirm backend `CLIENT_ORIGINS` includes the frontend origin.
- Confirm cookies are allowed by the browser.
- In production, confirm HTTPS is enabled.

`/readyz` returns `not_ready`:

- Check `DATABASE_URL`.
- Confirm the Neon database is reachable.
- Run migrations with `npx prisma migrate deploy`.

Invited users cannot log in:

- Confirm the invite link was accepted.
- Confirm the invite was not expired, revoked, or already used.
- Confirm the password meets the policy: at least 10 characters, with at least one letter and one number.

Seed users cannot log in:

- This is expected. Seed users are development data and do not have local password hashes.

## Security Notes

- Never commit `.env` or `.env.local` files.
- Rotate `JWT_ACCESS_SECRET` if it is exposed.
- Keep `AUTH_REQUIRED=true` outside local development.
- Keep public signup disabled unless the auth model is redesigned.
- Invite links and reset links are bearer secrets. Treat them like passwords.
- Password reset links expire after 30 minutes by default.
- Invite links expire after 7 days by default.
- Refresh tokens are rotated and stored as hashes in the database.
- Admin-only user and product mutation routes require an authenticated admin role.
