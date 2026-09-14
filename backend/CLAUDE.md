# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Spring Boot 4.1.1 / Java 21 backend for EXCELIS PRÉPAS, a multi-center school management system. This `backend/`
directory is a subproject of a larger repo rooted at `../` (git root is `../`, not here) - `../docker-compose.yml`
provisions the Postgres database and `../.env` supplies datasource credentials (loaded via
`spring.config.import: optional:file:../.env[.properties]` in `application.yaml`).

## Commands

Run all commands from the `backend/` directory using the Maven wrapper.

```bash
./mvnw spring-boot:run              # run the app (port 8080 by default)
./mvnw test                         # run all tests
./mvnw test -Dtest=EnseignantServiceTest            # run a single test class
./mvnw test -Dtest=EnseignantServiceTest#methodName # run a single test method
./mvnw compile                      # compile only
./mvnw clean package                # build the jar
```

Start the database before running the app or tests that need it:

```bash
docker compose -f ../docker-compose.yml up -d
```

Repository-adapter tests use Testcontainers (real Postgres in a container), so Docker must be running for those.

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

## Architecture

The codebase follows **hexagonal architecture (ports & adapters)**, organized by business module under
`src/main/java/com/excelisprepas/backend/`, plus a `shared/` package for cross-cutting concerns
(`shared/config/OpenApiConfig.java` and, for most modules, their exceptions - see below). Each module follows the
same package shape:

```
<module>/
  domain/
    model/       # plain Java domain objects, no framework annotations
    exception/   # domain-specific exceptions (older modules only - see note below)
    port/in/     # use-case interfaces the module exposes (driven by web/etc.)
    port/out/    # interfaces the domain needs from infrastructure (persistence, encoding, ...)
    service/     # use-case implementations, depend only on port/out interfaces
  infrastructure/
    config/      # Spring @Configuration wiring domain services to their ports (manual `new`, not @Service)
    in/web/      # @RestController, DTOs (Java records), @RestControllerAdvice exception handler
    out/persistence/  # JPA entities, Spring Data repositories, MapStruct mappers, port adapters
```

Existing modules (roughly in dependency order - later ones depend on earlier ones' `port/out` interfaces):
`personnel` (Enseignant, Utilisateur - staff and system users), `session` (SessionAcademique, the academic-year
container almost everything else is scoped to), `centre`, `academie` (submodules: `formation`, `departement`, `matiere`,
`salle`, `affectation`, `affectationdepartementale`, `progression`, `quota` - weekly per-matière/per-formation course
quota, enforced by `ProgressionService.creerProgression`, see `PROGRESSION_GERER_QUOTA` in **Security** below),
`apprenant` (students), `rattachement`
(attaching a `Utilisateur` to a `centre` with roles), `financier` (entrées/sorties, motifs, bilans journaliers,
validation workflow), `dossier` (admission concours, required pieces, a student's dossier and its financial
paiement/solde tracking - depends on `financier` for payments and on `session`/`apprenant`), `auth` (login, JWT
access/refresh tokens, permission model - see **Security** below, under active construction).

Key conventions to preserve when extending this:

- **Domain services are plain classes**, not Spring beans. They're instantiated manually inside an
  `infrastructure/config/*BeanConfiguration` class (e.g. `PersonnelBeanConfiguration`) and exposed only through their
  `port/in` interfaces. A module can have more than one `BeanConfiguration`/service pair when it has clearly separate
  sub-features (see `financier`, which has `FinancierBeanConfiguration`, `BilanJournalierBeanConfiguration`, and
  `ValidationMouvementBeanConfiguration` alongside `MouvementFinancierService`, `BilanJournalierService`,
  `ValidationMouvementService`, `MotifService`).
- **Cross-module composition happens in the domain layer, not just at wiring time**: a module's domain `service`
  routinely takes other modules' `port/out` repository interfaces as constructor dependencies (and reads their
  domain models) to validate invariants - e.g. `AffectationService` depends on `CentreRepositoryPort`,
  `FormationRepositoryPort`, `SalleRepositoryPort`, `EnseignantRepositoryPort`, `SessionAcademiqueRepositoryPort`,
  etc. The isolation boundary is "depend only on `port/out` interfaces of any module," not "never reference another
  module." When adding a new module that needs data from an existing one, inject that other module's `*RepositoryPort`
  rather than reaching into its service or infrastructure.
- **Domain models are framework-free** and self-validating: constructors/setters throw `IllegalArgumentException`/
  `NullPointerException` on invalid state (see `Personnel`, `Enseignant`, `Utilisateur`). `Personnel` is an abstract
  base class; `Enseignant` and `Utilisateur` extend it and fix their `ModeCalculPaie` (`PAR_SEANCE` vs `FIXE`).
- **Persistence uses class-table inheritance** for `Personnel`: `PersonnelEntity` is `@Entity` with
  `@Inheritance(strategy = InheritanceType.JOINED)`; `EnseignantEntity`/`UtilisateurEntity` extend it (backed by
  joined tables).
- **MapStruct** (`componentModel = "spring"`) maps between domain models and JPA entities in `*PersistenceMapper`
  interfaces; adapters (`*RepositoryAdapter`) implement the `domain/port/out` repository interface using the JPA
  repository + mapper.
- **Web layer**: controllers depend only on `port/in` use-case interfaces (never on domain services directly), use
  `@Valid @RequestBody` records for input, and translate domain exceptions to HTTP responses via a module-level
  `@RestControllerAdvice` (e.g. `PersonnelExceptionHandler`, `DossierExceptionHandler`) returning a `Map`-based error
  body (`timestamp`, `status`, `error`, `message`). A module can have more than one `@RestController` when it exposes
  more than one resource (e.g. `dossier` has `ConcoursController`, `PieceRequiseController`, `DossierController`,
  `DossierConcoursController`, `PieceDossierController`, `StatistiquesDossierController`, all sharing
  `DossierExceptionHandler`).
- **All REST endpoints are documented with springdoc/OpenAPI annotations**: a class-level `@Tag(name=..., description=...)`
  on the controller, and per-method `@Operation(summary=..., description=...)` plus `@ApiResponses`/`@ApiResponse`
  listing every realistic status code (400/404/409 as applicable) with its `@Content`/`@Schema` (use `@ArraySchema`
  for list responses). Keep new endpoints consistent with this - check `Swagger UI` output when in doubt.
- **Exception location is inconsistent across the codebase and both are in active use**: older modules
  (`personnel`, `affectation`, `centre`, `matiere`, `session`, `formation`, `salle`) keep their exceptions under
  their own `domain/exception/` package; every module added since keeps its exceptions in the shared
  `shared/exception/` package instead (there is no per-module `domain/exception` directory for `departement`,
  `apprenant`, `progression`, `rattachement`, `affectationdepartementale`, `financier`, `dossier`). When adding
  exceptions to one of the newer modules, put them in `shared/exception/`; don't create a new `domain/exception`
  package for them.
- **Domain/business text (field names, validation messages, entity/exception names) is in French**; keep new domain
  code consistent with this.

Tests mirror the module structure under `src/test/java`, one test class per production class, using JUnit 5 + Mockito
for domain/service/controller tests (`@WebMvcTest` for controllers with `@MockitoBean` for the use-case) and
Testcontainers/`@DataJpaTest`-style tests for the persistence adapter layer.

**Every `@WebMvcTest` class must also carry** `@AutoConfigureMockMvc(addFilters = false)` and
`@Import(com.excelisprepas.backend.shared.testsupport.TokenPortTestConfig.class)` (see `shared/testsupport` under
`src/test/java`). Reason: `SecurityConfig` (see **Security** below) is auto-included in every `@WebMvcTest` slice by
Spring Boot, and its `filterChain` bean needs a real `TokenPort` to construct `JwtAuthenticationFilter` even when
filters are disabled at request time - `TokenPortTestConfig` supplies a mocked one so the slice's `ApplicationContext`
can start. Omitting either annotation fails the test with a `NoSuchBeanDefinitionException` for `TokenPort` at
context startup, not a normal assertion failure.

## Security (under active construction)

Real backend authorization is being built in the `auth` module: JWT access tokens + DB-backed revocable refresh
tokens, with a named-`Permission` model (not raw `RoleUtilisateur` checks) enforced via Spring Security. Being built
block by block; as of now:

- `Permission` (`auth/domain/model`) - the enum of business actions requiring authorization (e.g.
  `FINANCIER_VALIDER_BILAN_CHEF_CENTRE`). Controllers should check permissions, not `RoleUtilisateur` names directly,
  so role changes don't ripple into every controller.
- `MatricePermissions` (`auth/domain/model`) - static `RoleUtilisateur -> Set<Permission>` mapping. **Draft, not yet
  validated with the business** - covers `financier` + `rattachement`, plus one `academie` permission
  (`PROGRESSION_GERER_QUOTA`, granted to `DIRECTEUR_ACADEMIQUE`; `DIRECTEUR` has it too via `EnumSet.allOf`) so far.
- `ContexteUtilisateur` (`auth/domain/model`) - the effective permissions of the authenticated user for the active
  academic session: global-role permissions (apply everywhere) plus centre-scoped `AttributionRole` permissions
  (apply only to the user's single centre for that session, per `RattachementRoleService`'s one-centre-per-session
  invariant). Built via `ContexteUtilisateur.depuis(...)`, never trusted from JWT claims directly (see below).
  `roleGlobal` itself can be centre-scoped: for `CHEF_CENTRE`/`CAISSIER`/`CHARGE_DOSSIER`, `Utilisateur.role` holds
  the same value as their `AttributionRole` (see `DatabaseSeeder.creerUtilisateurEtRattacher`), so `depuis(...)`
  checks `estCentreScope()` on `roleGlobal` too - don't assume `Utilisateur.role` is always global.
- `TokenPort` / `JwtTokenAdapter` (`auth/infrastructure/out/security`) - JWT access token generation/validation
  (jjwt, HS256, secret from `app.jwt.secret`). Claims carry identity (`sub`, `email`, `role`, `centreId`,
  `departementId`) only - **never** `AttributionRole`/centre-scoped permissions, since those can change while a
  token is still valid; they're re-read from the DB per request instead.
- `RefreshToken` (`auth/domain/model`) + `refresh_tokens` table (migration `V22`) - refresh tokens are opaque random
  strings; only their SHA-256 hash is persisted (`token_hash`), so a DB read never exposes a usable token. Revoking
  a row (`revoquer()`) is what makes logout / access revocation actually immediate, unlike the short-lived stateless
  access token.

- `JwtAuthenticationFilter` (`auth/infrastructure/in/web`) + `SecurityConfig` (`auth/infrastructure/config`) - wired.
  Stateless (`SessionCreationPolicy.STATELESS`), CSRF disabled, CORS delegated to the existing
  `shared/config/CorsConfig` via `.cors(Customizer.withDefaults())`. **Every route requires authentication by
  default** except `/api/auth/**` and Swagger - see `ROUTES_PUBLIQUES` in `SecurityConfig`. `@EnableMethodSecurity`
  is on, ready for `@PreAuthorize` (not used by any controller yet). The filter builds request authorities from the
  JWT's `role` claim only (via `MatricePermissions`) - centre-scoped `AttributionRole` permissions are deliberately
  not in these authorities (see `ContexteUtilisateur` above); `@PreAuthorize("hasAuthority(...)")` is therefore only
  the coarse "can this role ever do this" gate, not the centre-scope check (that's `ContexteUtilisateurPort`, below).
  **`JwtAuthenticationFilter` deliberately has no `@Component`** - it's instantiated manually (`new
  JwtAuthenticationFilter(tokenPort)`) inside `SecurityConfig.filterChain()`. A `@Component`-annotated `Filter` bean
  gets auto-registered by Spring Boot as a *second*, separate servlet-level filter (in addition to its
  `addFilterBefore` placement inside the security chain), so it runs twice at two different points - the SecurityContext
  set by the duplicate run can land after `AuthorizationFilter` already rejected the request. If a request logs
  `JwtAuthenticationFilter` succeeding yet still gets a 401, check for this before anything else.
- `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout` (`AuthController`) - `AuthentificationService` now
  implements `SeConnecterUseCase` + `RafraichirTokenUseCase` + `SeDeconnecterUseCase` together (they share the
  token-issuing/hashing logic). Login and refresh both return `{accessToken, refreshToken, utilisateur}`
  (`LoginResponse` - reused for both, not login-specific despite the DTO name). Refresh rotates the refresh token
  (old one revoked on use); logout revokes it. `TokenInvalideException` -> 401 via `AuthExceptionHandler`.
- `ContexteUtilisateurPort` / `ContexteUtilisateurAdapter` (`auth/infrastructure/out/security`) - reads the
  `ClaimsAccessToken` principal from `SecurityContextHolder`, resolves the active session
  (`SessionAcademiqueRepositoryPort.findEnCours()`), then the caller's centre for that session
  (`RattachementCentreRepositoryPort.findByUtilisateurIdAndSessionId`) and their attributions
  (`AttributionRoleRepositoryPort.findByUtilisateurIdAndSessionId`) to build a fresh `ContexteUtilisateur` on every
  call - never cached, never derived from JWT claims alone. Throws `IllegalStateException` if called with no
  authentication in context (a programming error - only call this behind an authenticated route). Inject it into a
  domain service (like any other module's `*RepositoryPort`) wherever a centre-scope check is needed alongside a
  `@PreAuthorize` permission gate.

- **`@PreAuthorize` is wired on every `financier` controller** (`MouvementFinancierController`, `MotifController`,
  `BilanJournalierController`, `ValidationMouvementController`) per the `MatricePermissions` mapping - validated
  with the business, no longer a draft for this module. Each endpoint checks `hasAuthority('PERMISSION_NAME')`
  before the domain method-based `port/in` interfaces are called. `ValidationMouvementController.validerMouvement`
  reuses `FINANCIER_VALIDER_BILAN_CONTROLEUR` (no dedicated permission - it's a comptable/contrôleur-level decision,
  same actor as bilan controller validation).
  **Caveat found while verifying**: a plain `@WebMvcTest` slice does *not* actually enforce `@PreAuthorize` (method
  security isn't fully wired into that narrow context), so those tests keep passing/failing on business logic alone
  regardless of the annotation - they do NOT catch a wrong or missing permission. `@PreAuthorize` was verified
  end-to-end manually instead (real login as CAISSIER vs DIRECTEUR against a running instance) - do the same after
  changing any permission until a real security-integration test exists for this.
  **Not yet done**: the centre-scope refinement via `ContexteUtilisateurPort` inside the financier domain services
  (e.g. a CAISSIER can currently create/modify movements for *any* centre, not just their own - `@PreAuthorize` only
  checks the coarse "can this role ever do this," never the centre). `MouvementFinancierService` in particular has
  no clean seam for this yet (two constructors, heavy existing test suite) - treat as its own follow-up task, not a
  quick addition.

The frontend (`../frontend`) has been adapted to this token model - see **Security** in `../frontend/CLAUDE.md` for
how it stores/rotates the access token and revokes the refresh token on logout.

- **`academie/quota`** (`QuotaHebdomadaireController`, `PUT`/`GET /api/quotas-hebdomadaires`) - the weekly max-courses
  quota a Directeur Académique sets per `(formationId, sessionId, matiereId, semaine)` (migration `V23`,
  `quotas_hebdomadaires` table). `PUT` (upsert) is gated by `@PreAuthorize("hasAuthority('PROGRESSION_GERER_QUOTA')")`;
  `GET` (listing) is open to any authenticated user, since a Chef de Département needs to read the quota too, just
  not set it. `ProgressionService.creerProgression` enforces it: if a `QuotaHebdomadaire` row exists for that
  triplet, it counts existing `Progression` rows for the same `(formation, session, matière, semaine)` and throws
  `QuotaHebdomadaireDepasseException` (409) once the count reaches the quota; **no row means no limit** (unchanged
  free-entry behavior), so this is opt-in per matière/semaine, not a default cap. This closes a real gap: the
  frontend previously kept this quota in `localStorage` only (never sent to the backend), so it was purely a UI
  hint a Chef de Département could ignore or bypass entirely - see **Security** in `../frontend/CLAUDE.md` for the
  frontend side of this fix.

Still to come: centre-scope enforcement in `financier` services (see caveat above), then extending both
`@PreAuthorize` and `MatricePermissions` to other modules as they get real endpoints protected. Update this section
as each piece lands.

## Configuration notes

- `spring.jpa.hibernate.ddl-auto` defaults to `update`, but **Flyway is enabled by default** (`FLYWAY_ENABLED:true`
  in `../.env`) and is the actual source of schema changes - migrations live under
  `src/main/resources/db/migration/` (`V1`...). Despite what this file previously said, don't rely on Hibernate
  auto-DDL for new schema changes: add a new `V<n>__description.sql` migration instead.
- Datasource/server settings are all environment-variable driven with local defaults (`DB_HOST`, `DB_PORT:5433`,
  `DB_NAME:excelis_prepas`, `DB_USER`, `DB_PASSWORD`, `SERVER_PORT:8080`) - see `application.yaml` and
  `../docker-compose.yml`.
- JWT settings (`app.jwt.*`) follow the same env-var-with-dev-default pattern: `JWT_SECRET` (HS256 key, **must** be
  overridden in `../.env` for anything beyond local dev - generate with `openssl rand -base64 32`),
  `JWT_ACCESS_TTL_MINUTES` (default 20), `JWT_REFRESH_TTL_DAYS` (default 30, not yet read anywhere - wired when the
  login/refresh service lands).
- This environment's default `java`/Maven JDK (25) fails Maven's in-process compile with "release version 21 not
  supported", unrelated to app code - prefix Maven commands with
  `JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64` here if you hit that.
