# Task Manager

A full-stack task management app built with Next.js 16 App Router, Prisma, and Neon Postgres.

**Tech stack:** Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui · Prisma · Neon Postgres · jose JWT · bcryptjs · Vercel Blob · TanStack Query · next-themes · Playwright · GitHub Actions

---

## Live Demo

```
Frontend + Backend: [Deployed on Vercel — add link here]
Note: Both the UI and the REST API are served from the same Vercel deployment URL.
```

---

## Features

**Core**
- Task CRUD (create, read, update, delete)
- JWT authentication (signup / login / logout / session persistence)
- Filter by status, search by title, sort by created/due/priority, offset pagination

**Bonus**
- Admin read-only view of all users' tasks
- SSE real-time updates (task events pushed to connected clients)
- Optimistic UI for complete-toggle and delete (instant update + rollback on failure)
- Vercel Blob file attachments (images, pdf, doc, txt; ≤ 5 MB)
- Per-task activity log (create, update, status change, attachment add/remove, delete)
- Dark mode with system default and persistence across reloads
- Docker local dev (one-command Postgres + app)
- GitHub Actions CI (lint + build + Playwright E2E)

---

## Prerequisites

- Node.js 20+
- npm
- A Neon Postgres account (free tier works)
- A Vercel account (for Blob token)

---

## Local Setup

```bash
git clone <repo-url>
cd task-management-assignment
npm install
cp .env.example .env.local   # fill in all values (see Environment Variables below)
npx prisma migrate dev        # run database migrations
npx prisma db seed            # seed regular + admin accounts and sample tasks
npm run dev                   # starts at http://localhost:3000
```

---

## Seeded Test Accounts

| Role | Email | Password |
|---|---|---|
| Regular User | user@taskmanager.dev | User1234! |
| Admin | admin@taskmanager.dev | Admin1234! |

---

## Running Tests

```bash
npx playwright install
npx playwright test
```

See [testcases.md](testcases.md) for all 33 E2E scenarios.

---

## Docker (local dev alternative)

```bash
docker-compose up
```

This uses a local Postgres container, not Neon. Update `DATABASE_URL` and `DIRECT_URL` in `.env.local` to point to `localhost:5432` when using Docker.

---

## Deploying to Vercel

```
1. Push the repository to GitHub.
2. Import the project in the Vercel dashboard (select task-management-assignment/ as the root directory).
3. Add all environment variables from .env.example in the Vercel project settings.
4. Deploy — both the frontend and the API are served from the same deployment URL.
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon pooled connection string (used at runtime by Prisma) |
| `DIRECT_URL` | Neon direct connection string (used by Prisma Migrate) |
| `JWT_SECRET` | JWT signing secret — generate with `openssl rand -base64 32` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |
| `NEXT_PUBLIC_APP_URL` | Public app URL, no trailing slash (e.g. `http://localhost:3000`) |

---

## Assumptions and Trade-offs

- No email verification or password reset (not required by brief)
- SSE is server→client only; no collaborative editing (last-write-wins)
- Admin is read-only — no cross-user edit/delete, no user management UI
- Attachment virus scanning not included; type + size validation only
- Priority sort uses enum string order (alphabetical: HIGH < LOW < MEDIUM), not semantic order
- Docker is for local dev only; Neon is used in the deployed environment

See [context.md](context.md) for the full architecture decision log.

---

## Project Structure

```
task-management-assignment/
├── app/
│   ├── api/              # REST API route handlers
│   │   ├── auth/         # signup, login, logout, me
│   │   ├── tasks/        # CRUD + activity + attachments
│   │   ├── admin/tasks/  # admin read-only list
│   │   └── stream/       # SSE real-time stream
│   ├── admin/            # Admin page (/admin)
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── page.tsx          # Dashboard (/)
├── components/           # UI components (tasks, layout, providers, ui)
├── lib/                  # Auth, DB, session, hooks, schemas, utils
├── prisma/               # schema.prisma, migrations/, seed.ts
├── .env.example          # All required environment variables
├── middleware.ts          # JWT auth + admin guard
├── PRD.md                # Product Requirements Document
├── context.md            # Architecture decision log
└── testcases.md          # E2E test scenarios for Playwright
```

---

## API Reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, sets httpOnly JWT cookie |
| POST | `/api/auth/logout` | Auth | Clear session cookie |
| GET | `/api/auth/me` | Auth | Current user |
| POST | `/api/tasks` | Auth | Create task |
| GET | `/api/tasks` | Auth | List tasks (filter/search/sort/paginate) |
| GET | `/api/tasks/[id]` | Auth | Get single task |
| PATCH | `/api/tasks/[id]` | Auth (owner) | Update task |
| DELETE | `/api/tasks/[id]` | Auth (owner) | Delete task |
| GET | `/api/tasks/[id]/activity` | Auth | Activity log |
| POST | `/api/tasks/[id]/attachments` | Auth (owner) | Upload attachment |
| DELETE | `/api/tasks/[id]/attachments/[attId]` | Auth (owner) | Remove attachment |
| GET | `/api/admin/tasks` | Admin | All users' tasks (read-only) |
| GET | `/api/stream` | Auth | SSE real-time stream |
