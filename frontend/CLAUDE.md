# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Next.js (App Router, TypeScript) frontend for EXCELIS PRÉPAS, a multi-center school management system. This
`frontend/` directory is a subproject of a larger repo rooted at `../` (git root is `../`, not here) — the backend
lives in `../backend` (Spring Boot, hexagonal architecture, see `../backend/CLAUDE.md`) and `../docker-compose.yml`
provisions the Postgres database it uses. This app is a pure API client: it has no business logic of its own beyond
presentation/validation — all business rules live in the backend and are enforced there.

This is a solo project. Keep the organization simple and direct; don't add abstraction layers or process meant for a
team of several people.

## Commands

Run all commands from the `frontend/` directory using pnpm.

```bash
pnpm install                # install dependencies
pnpm dev                    # run the dev server (http://localhost:3000)
pnpm build                  # production build
pnpm start                  # run the production build
pnpm lint                   # ESLint
pnpm lint:fix                # ESLint, applying safe fixes
pnpm format                  # Prettier, writes formatting fixes
pnpm format:check            # Prettier, check only (no writes)
```

Copy `.env.local.example` to `.env.local` before running the app; it only needs `NEXT_PUBLIC_API_BASE_URL` (defaults
to the backend's local dev port, `http://localhost:8080`).

## Architecture

The codebase is organized by business module under `src/modules/`, mirroring the backend's module boundaries
(`dossiers`, `apprenants`, `centres-sessions`, `academique`, `finances`, `paie`, `concours-blancs`, `utilisateurs`,
`alertes`), plus `src/app/` for routing and `src/shared/` for cross-cutting concerns.

```
src/
  app/                # Next.js App Router — routing ONLY
    (auth)/            # route group: screens with no active session (login...)
    (dashboard)/        # route group: the logged-in space, one subfolder per module
      <module>/...       # thin page.tsx files that compose components from modules/
      layout.tsx           # sidebar + active-role switcher, shared by the whole space
    layout.tsx             # root layout: fonts, global providers
    providers.tsx           # global providers (TanStack Query...), colocated here
                             # because only the root layout uses it

  modules/             # the business core, one folder per backend module
    <module>/
      domain/
        types.ts        # TS types — field names IN FRENCH, matching the backend's
                         # JSON contract exactly (e.g. montantContrat, dateOuverture,
                         # statut: "Ouvert" | "Complet" | "Cloture")
        schemas.ts        # Zod schemas (French field names), reused by both React
                           # Hook Form and to validate API responses. No React/Next
                           # dependency in domain/ — it must stay framework-free.
      data/
        client.ts          # typed fetch functions to this module's backend endpoints,
                            # built on shared/lib/api-client.ts
        queries.ts           # TanStack Query read hooks (useDossier, useDossiers...)
        mutations.ts           # TanStack Query mutation hooks (useCloturerDossier...)
      components/               # React components actually shared across more than
                                 # one screen of this module (English names)
      index.ts                  # barrel export: what the rest of the app may import
                                 # from this module — nothing else should reach into
                                 # a module's internals directly

  shared/
    ui/                 # design system: Button, Card, Badge, Table, StatusPill —
                         # no business logic
    layout/              # Sidebar, TopBar, RoleSwitcher, MobileNav
    auth/                 # active session/role context, route guards
    lib/                   # generic fetch wrapper (api-client.ts), QueryClient config
                            # (query-client.ts), other cross-cutting utils
    config/                  # brand tokens (brand.ts) and font setup (fonts.ts),
                             # re-exported for use across the app

  types/                # only types that are truly transverse to the whole app
                        # (e.g. the Role enum) — a module's own domain types stay in
                        # that module's domain/types.ts, not here
```

Key conventions to preserve when extending this:

- **Colocate before you promote to `modules/`.** `app/` is routing-only, but Next.js allows non-`page.tsx` files
  colocated inside a route folder — use that. A component or hook used by exactly one screen belongs next to that
  screen under `app/`, not under `modules/<module>/components/`. Only move something into `modules/` once a second
  screen genuinely needs it. Don't pre-emptively generalize.
- **Language split: French for data, English for code.** User-facing text (labels, messages, anything rendered to
  the user) is in French, matching `../backend`'s domain text. Data fields — `domain/types.ts`, `domain/schemas.ts`,
  anything shaped by an API response — are also in French, because they must match the backend's JSON contract
  exactly (field-for-field, including casing). File names, function names, component names, and folder names are in
  English, following normal TS/React/Next.js convention. Don't translate a field just because "it reads oddly in
  English code" — the whole point is that `domain/types.ts` is a faithful mirror of what the backend actually sends.
- **`domain/` has no framework dependency.** `domain/types.ts` and `domain/schemas.ts` must not import React, Next,
  or any UI library — they're plain TS/Zod, reusable by both the data layer and by forms.
- **`domain/schemas.ts` is shared between form validation and API response validation.** The same Zod schema (or a
  close derivation of it) backs both `zodResolver` in a React Hook Form and runtime-checking what `data/client.ts`
  gets back from the backend — don't duplicate the shape in two places.
- **A module's `data/client.ts` is the only place that calls `shared/lib/api-client.ts` directly.** Components and
  pages consume `queries.ts`/`mutations.ts` hooks, never `apiFetch` or `fetch` directly.
- **Brand tokens, never raw hex.** Tailwind is configured CSS-first (Tailwind v4, no `tailwind.config.ts`): the
  `brand.*` color tokens (`orange`, `anthracite`, `blue`, `white`, `gray`, `black`) are declared in `src/app/
globals.css` under `@theme inline` (mirrored, for reference, in `src/shared/config/brand.ts`). Use the Tailwind
  utility classes (`bg-brand-orange`, `text-brand-anthracite`, ...) — never hardcode a hex value in component code.
- **Font: Montserrat, Bold and Regular only.** Loaded via `next/font/google` in `src/shared/config/fonts.ts`, wired
  to Tailwind's `--font-sans` in `globals.css`. Don't add other weights, and don't load the logo's Lemon Milk font
  anywhere in the interface — it's reserved for the logo asset itself.
- **A module can only reach into another module through its `index.ts` barrel** (or by depending on backend data
  shaped independently, e.g. two modules both fetching `centre` data). Don't import from `modules/<other>/domain`
  or `modules/<other>/data` directly.

## Configuration notes

- Package manager is pnpm; there is no npm/yarn lockfile — don't generate one.
- `NEXT_PUBLIC_API_BASE_URL` is the only required env var (see `.env.local.example`); it's read in
  `src/shared/lib/api-client.ts`.
- ESLint (`eslint-config-next` + `eslint-config-prettier`) and Prettier (`prettier-plugin-tailwindcss` for class
  sorting) are both configured; run `pnpm lint` and `pnpm format:check` before considering a change done.
- `frontend/out/` (static export output, if ever used) is the only frontend build path the root `.gitignore` scopes
  by name — don't broaden that rule to a bare `out/`.
