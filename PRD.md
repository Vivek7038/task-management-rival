# Product Requirements Document — Task Manager

## 1. Project Overview

Task Manager is a single Next.js 16 App Router application serving both the UI and REST API from one Vercel deployment, backed by Neon Postgres via Prisma. The goal is a full-stack take-home assessment demonstrating CRUD, authentication, real-time updates, file storage, and role-based access control.

See also: [context.md](context.md) for architectural decisions, [testcases.md](testcases.md) for E2E scenarios.

---

## 2. User Personas

| Persona | Description |
|---|---|
| Regular User | Authenticated user who manages only their own tasks |
| Admin | Authenticated user with `ADMIN` role; read-only view of all users' tasks |
| Visitor | Unauthenticated; can only access `/login` and `/signup` |

---

## 3. Core Features

### 3.1 Authentication

- **Signup:** name, email, password (validated via Zod). Passwords hashed with bcryptjs (cost 12). On success, session cookie is set and user is redirected to the dashboard.
- **Login:** email + password; session JWT written to an httpOnly, secure, sameSite cookie via `jose`.
- **Logout:** cookie cleared; user redirected to `/login`.
- **Session persistence:** middleware reads the cookie on every request; protected routes redirect unauthenticated visitors to `/login`.
- **Middleware guards:** all routes except `/login` and `/signup` require a valid session; `/admin` additionally requires `role === ADMIN`.

### 3.2 Task CRUD

- **Create:** title is required; description, status, priority, and dueDate are optional (defaults: status `TODO`, priority `MEDIUM`).
- **Read:** owner-scoped — users see only their own tasks.
- **Update:** any field may be updated; owner-only.
- **Delete:** owner-only; triggers an activity log entry.

### 3.3 Frontend

- **Dashboard (`/`):** task list with create/edit modal, mark-complete toggle, delete with confirm dialog.
- **Auth pages:** `/login` and `/signup` with form validation.
- **Task detail sheet:** shows full task info, activity log, and attachments.

### 3.4 Filter / Search / Sort / Pagination

All parameters compose in a single query:

| Parameter | Values |
|---|---|
| `status` | `TODO`, `IN_PROGRESS`, `DONE` |
| `search` | Title substring match (debounced on client) |
| `sortBy` | `createdAt`, `dueDate`, `priority` |
| `order` | `asc`, `desc` |
| `page` | Integer ≥ 1 |
| `limit` | Integer (default 10) |

Response shape: `{ items, total, page, limit, totalPages }`

---

## 4. Bonus Features

| Feature | Description |
|---|---|
| **Admin role** | `/admin` page (read-only) and `GET /api/admin/tasks`; non-admins redirected to `/` by middleware |
| **SSE real-time** | `GET /api/stream` — users receive their own task events; admins receive all events; backed by an in-process event bus; works on Vercel serverless |
| **Optimistic UI** | Mark-complete toggle and delete update the UI instantly; roll back with toast on failure |
| **Vercel Blob attachments** | Upload (images, pdf, doc, txt; ≤ 5 MB) and delete per task; Blob URL + metadata stored in Postgres `Attachment` table |
| **Activity log** | Every mutation writes an `ActivityLog` row (create, update, status change, attachment add/remove, delete); viewable in task detail sheet |
| **Dark mode** | `next-themes` provider with header toggle; persists across reloads (system default on first visit) |
| **Docker (local dev)** | `docker-compose.yml` for one-command local setup with a local Postgres instance |
| **GitHub Actions CI** | `.github/workflows/ci.yml` runs lint + build + Playwright E2E on push |

---

## 5. API Contract Summary

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
| GET | `/api/tasks/[id]/activity` | Auth | Activity log for task |
| POST | `/api/tasks/[id]/attachments` | Auth (owner) | Upload attachment |
| DELETE | `/api/tasks/[id]/attachments/[attId]` | Auth (owner) | Remove attachment |
| GET | `/api/admin/tasks` | Admin | All users' tasks (read-only) |
| GET | `/api/stream` | Auth | SSE real-time stream |

### Error Contract

All error responses share the same shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description",
    "details": {}
  }
}
```

| HTTP Status | Meaning |
|---|---|
| 400 | Validation error (Zod) |
| 401 | Missing or invalid session |
| 403 | Forbidden (wrong owner or insufficient role) |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate email on signup) |
| 500 | Unexpected server error |

---

## 6. Data Model Summary

| Model | Key Fields |
|---|---|
| `User` | id, email, passwordHash, name, role (`USER`\|`ADMIN`), createdAt, updatedAt |
| `Task` | id, userId (FK), title, description, status (`TODO`\|`IN_PROGRESS`\|`DONE`), priority (`LOW`\|`MEDIUM`\|`HIGH`), dueDate, createdAt, updatedAt |
| `Attachment` | id, taskId (FK), blobUrl, fileName, mimeType, sizeBytes, createdAt |
| `ActivityLog` | id, taskId (FK), actorId (FK User), action (`CREATED`\|`UPDATED`\|`STATUS_CHANGED`\|`ATTACHMENT_ADDED`\|`ATTACHMENT_REMOVED`\|`DELETED`), metadata (JSON), createdAt |

---

## 7. Non-Functional Requirements

### Security
- httpOnly + secure + sameSite cookies for session storage
- bcryptjs password hashing with cost factor 12
- Zod validation on every write operation
- Owner-scoped queries — users cannot access others' tasks
- Admin is read-only — no cross-user mutations

### Performance
- Neon serverless pooled connection string at runtime
- Prisma indexes on `userId`, `status`, `dueDate`, `priority`, `createdAt`, `title`
- TanStack React Query for client-side caching and deduplication

### Accessibility
- shadcn/ui components built on Radix UI primitives
- Keyboard-navigable modals and dialogs
- Full dark mode support via `next-themes`

---

## 8. Out of Scope

- Email verification / password reset
- Collaborative editing / conflict resolution (last-write-wins for concurrent updates)
- Cross-user edit or delete for admin
- Attachment virus scanning
- User management UI
