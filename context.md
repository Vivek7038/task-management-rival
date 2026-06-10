# Architecture Decision Log — Task Manager

This file is a running log of key architectural decisions, assumptions, and trade-offs made during the project.

---

## Decision 1 — App Architecture

**Choice:** Single Next.js App Router application; UI + API route handlers in one Vercel project.

**Rationale:** Single deployable, single live URL, matches the brief's requirement for one running deployment. No separate backend service needed.

**Trade-off:** API and UI share the same serverless runtime limits (execution time, memory). Acceptable at this scale.

---

## Decision 2 — Authentication

**Choice:** Custom JWT via `jose` stored in an httpOnly, secure, sameSite cookie. `bcryptjs` (cost 12) for password hashing.

**Rationale:** Matches the brief literally. httpOnly cookie is XSS-safe and survives page refreshes without client storage. No NextAuth dependency keeps the implementation transparent.

**Trade-off:** No built-in refresh token rotation. Acceptable for assessment scope — the JWT expiry window is set short enough for demo purposes.

---

## Decision 3 — ORM and Database

**Choice:** Prisma + Prisma Migrate on Neon Postgres. Two connection strings: `DATABASE_URL` (pooled, used at runtime) and `DIRECT_URL` (direct, used by Prisma Migrate).

**Rationale:** Type-safe models and versioned migrations via Prisma Migrate. Neon's serverless adapter handles connection pooling correctly in Vercel's ephemeral serverless environment.

**Trade-off:** Two env vars required instead of one. Necessary because Neon's pooler does not support the DDL statements Prisma Migrate emits.

---

## Decision 4 — Real-time Updates

**Choice:** Server-Sent Events (SSE) via a single `GET /api/stream` route handler backed by an in-process event bus (`lib/event-bus.ts`).

**Rationale:** Works on Vercel serverless without a persistent WebSocket server. No extra service (Redis pub/sub, Pusher, etc.) required — keeps the deployment self-contained.

**Trade-off:** Server-to-client only (no client-to-server push). Events are lost if the serverless instance handling the SSE connection is recycled. Acceptable for demo purposes.

---

## Decision 5 — File Storage

**Choice:** Vercel Blob (`@vercel/blob`). Blob URL and metadata (fileName, mimeType, sizeBytes) stored in the Postgres `Attachment` table.

**Rationale:** Native to Vercel, no additional configuration beyond a `BLOB_READ_WRITE_TOKEN`. Survives ephemeral serverless filesystem. Postgres retains queryable metadata without needing to hit the Blob API for listings.

**Trade-off:** No virus scanning; type + size validation only (images, pdf, doc, txt; ≤ 5 MB). Acceptable for assessment scope.

---

## Decision 6 — State Management and Data Fetching

**Choice:** TanStack React Query v5.

**Rationale:** Provides caching, loading/error states, and built-in optimistic mutation + rollback patterns used for the complete-toggle and delete flows.

**Trade-off:** Additional dependency. Lighter alternatives (SWR, `useEffect` fetch) could work but React Query's `onMutate`/`onError` rollback API is the cleanest fit for optimistic UI.

---

## Decision 7 — UI Library

**Choice:** Tailwind CSS v4 + shadcn/ui + `next-themes`.

**Rationale:** shadcn/ui components are built on Radix UI primitives, providing accessible, keyboard-navigable dialogs, modals, and popovers out of the box. `next-themes` gives persistent dark mode with system default on first visit.

**Trade-off:** Tailwind v4 is newer; some ecosystem tooling (PostCSS plugins, IDE extensions) may lag behind v3 ergonomics.

---

## Decision 8 — Validation

**Choice:** Zod v4 schemas in `lib/schemas/` shared between server route handlers and client forms (via React Hook Form + `@hookform/resolvers`).

**Rationale:** Single source of truth for request shape and form validation. Eliminates drift between client-side and server-side checks.

**Trade-off:** None significant at this scale.

---

## Decision 9 — Admin Role

**Choice:** Read-only across all tasks; no cross-user mutations; no user management UI.

**Rationale:** Matches the brief literally. Safer default — admin privilege escalation bugs are hard to audit.

**Trade-off:** Admins cannot act on tasks even in obvious moderation scenarios. A future iteration could add scoped write permissions.

---

## Decision 10 — Enum Design

**Choice:** Status enum: `TODO | IN_PROGRESS | DONE`. Priority enum: `LOW | MEDIUM | HIGH`.

**Rationale:** Directly matches the brief's specified values.

**Trade-off:** Priority sort via Prisma uses enum string order (alphabetical: `HIGH < LOW < MEDIUM`), not semantic order (`LOW < MEDIUM < HIGH`). This is a known limitation — a raw SQL `ORDER BY CASE` or a numeric mapping column would fix it, but adds complexity not required by the brief.

---

## Decision 11 — Pagination

**Choice:** Offset/limit pagination with total count. Response: `{ items, total, page, limit, totalPages }`.

**Rationale:** Simple, stateless, fully compatible with filter/sort composition. No cursor management needed.

**Trade-off:** Offset pagination can skip or repeat rows if data changes mid-pagination. Acceptable for this scale.

---

## Decision 12 — Optimistic UI Scope

**Choice:** Optimistic updates applied only to mark-complete toggle and delete.

**Rationale:** These are the highest-frequency, lowest-risk mutations. Both have clear rollback signals. Full optimistic create/edit would require local ID generation and is more complex to reconcile.

**Trade-off:** Create and edit feel slightly slower (wait for server response). Acceptable UX given infrequency.

---

## Decision 13 — Seed Accounts

**Choice:** Fixed regular + admin credentials in `prisma/seed.ts` for E2E reproducibility. Idempotent via `upsert`.

**Rationale:** CI and manual testers need deterministic credentials. Idempotency means `npx prisma db seed` is safe to run multiple times.

**Trade-off:** Hardcoded credentials in source. Acceptable for a take-home assessment; would use environment-variable-driven seeding in production.

---

## Decision 14 — Testing Strategy

**Choice:** Playwright E2E spec suite, CI-runnable via GitHub Actions.

**Rationale:** Single source of truth for feature correctness. Tests the full stack (UI + API + DB) rather than mocking layers. `testcases.md` documents all 33 scenarios for the Playwright MCP.

**Trade-off:** E2E tests are slower than unit tests and require a running app + seeded database. No unit tests for individual utilities — acceptable at this scale.

---

## Decision 15 — Docker

**Choice:** `docker-compose.yml` for local dev with a local Postgres container.

**Rationale:** Allows contributors to run the full stack locally without a Neon account. One command (`docker-compose up`) brings up Postgres + the Next.js dev server.

**Trade-off:** Neon is used in the deployed environment; developers must update `DATABASE_URL`/`DIRECT_URL` in `.env.local` when switching between Docker and Neon. Documented in the README.
