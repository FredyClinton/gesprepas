# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

GESPREPAS: management system (ERP/SIS) for EXCELIS PRÉPAS, a network of preparatory classes spread over several
physical centres. Everything is scoped to an academic session (`SessionAcademique`, one active at a time) and, for
most roles, to a centre. Domain vocabulary (code, DB, API, UI) is French.

Monorepo with two independent subprojects, each with its own, more detailed `CLAUDE.md` - **read the relevant one
before working in it**:

- `backend/` - Spring Boot 4.1 / Java 21, hexagonal architecture (ports & adapters), PostgreSQL + Flyway. See
  `backend/CLAUDE.md`.
- `frontend/` - Next.js 16 (App Router, Turbopack) / React 19 / TypeScript, TanStack Query, NextAuth. See
  `frontend/CLAUDE.md` and `frontend/AGENTS.md` (Next 16 has breaking changes vs. training data: read
  `frontend/node_modules/next/dist/docs/` before writing Next-specific code).

Other top-level content:

- `docker-compose.yml` - local PostgreSQL 18 only (host port `5433` by default), configured from `.env`.
- `.env` (gitignored) - DB credentials, `FLYWAY_ENABLED`, `JWT_SECRET`...; read by both docker-compose and the
  backend (`spring.config.import: optional:file:../.env[.properties]`).
- `PROJECT_BRIEFING.md` - functional map of the modules, role matrix and business rules (in French). Some technical
  details there are stale (it says Spring Boot 3, `npm`, migrations up to `V21`); the subproject `CLAUDE.md` files
  and the code win.
- `docs/` - business specs/plans (`docs/superpowers/specs`, `docs/superpowers/plans`, `plan_*.md`).
- `graphify-out/`, `backup_*.sql`, `*.session.sql`, `scratch/` - gitignored local artifacts, not sources.

## Commands

```bash
docker compose up -d                       # start Postgres (from repo root) - needed by backend and its tests

# backend/ (Maven wrapper). The machine's default JDK (25) breaks the build: force JDK 21.
cd backend
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw spring-boot:run       # API on :8080, Swagger at /swagger-ui.html
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw test
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw test -Dtest=ClassName#method   # single test

# frontend/ (pnpm). Node 24 via nvm.
cd frontend
pnpm dev            # :3000 (pnpm dev:webpack if Turbopack misbehaves)
pnpm lint
pnpm format:check
pnpm build          # also the type-check gate; there is no frontend test runner
```

Frontend needs `frontend/.env.local` (copy from `.env.local.example`; only `NEXT_PUBLIC_API_BASE_URL`).
Backend repository-adapter tests use Testcontainers, so Docker must be running.

## Cross-cutting architecture

- **Module boundaries mirror each other**: backend modules under `backend/src/main/java/com/excelisprepas/backend/<module>/`
  (`domain/{model,port/in,port/out,service}` + `infrastructure/{config,in/web,out/persistence}`) and frontend modules
  under `frontend/src/modules/<module>/` (`domain/types.ts`, `data/client.ts`, `data/queries.ts`, `components/`,
  `index.ts`). Names differ slightly (e.g. backend `academie` / `gelenseignants` vs frontend `academique` /
  `gel-enseignants`). A feature usually touches both sides: frontend types in `domain/types.ts` mirror backend DTO
  records.
- **Domain stays framework-free**: no Spring/JPA in `domain/`; services are wired manually in
  `infrastructure/config` (`new`, not `@Service`). New business needs start with a `port/in` use case and a
  `port/out` port.
- **Auth spans both sides**: backend issues JWT access tokens + DB-backed revocable refresh tokens and authorizes via
  named `Permission`s (`MatricePermissions`, `@PreAuthorize`), with centre-scoped rights re-read from DB per request
  (`ContexteUtilisateurPort`), never from JWT claims. Frontend carries the token on the NextAuth session and has one
  `Role` per user (`frontend/src/types/roles.ts` mirrors backend `RoleUtilisateur`). Details in each `CLAUDE.md`'s
  Security section. Frontend-only checks are UI hints, not authorization - enforce rules in the backend.
- **Schema changes go through Flyway** (`backend/src/main/resources/db/migration/V<n>__description.sql`): never edit
  an applied migration, always add the next version.

## Business invariants not to bypass

- An `ENTREE`/`SORTIE` financial movement cannot be modified or deleted once a `BilanJournalier` exists for its
  centre/session/date (`BilanDejaValideException` -> 409). Bilan lifecycle: `OUVERT` -> `EN_ATTENTE_CONTROLEUR` ->
  `CLOTURE`.
- Cancelling a financial movement must clean up dependent records (e.g. deleting the `ENTREE` linked to a book sale
  purges its `ventes_livres` rows).
- Payments are allocated FIFO: initial contract first, then successive per-phase avenants.

## Conventions

- Frontend async loading uses the `Skeleton` / `SkeletonCard` / `SkeletonTable` components from `src/shared/ui/`;
  every `useMutation` invalidates the affected TanStack Query keys.
- `next dev` re-writes the Next.js agent-rules block in `frontend/AGENTS.md`; an unexpected diff there is that, not
  someone's edit.
- Commit messages follow `type(scope): description` in French (e.g. `feat(backend, frontend): ...`,
  `fix(personnel, remuneration): ...`).
