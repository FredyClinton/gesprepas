# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Spring Boot 4.1.1 / Java 21 backend for EXCELIS PRÉPAS, a multi-center school management system. This `backend/`
directory is a subproject of a larger repo rooted at `../` (git root is `../`, not here) — `../docker-compose.yml`
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
(`shared/config/OpenApiConfig.java` and, for most modules, their exceptions — see below). Each module follows the
same package shape:

```
<module>/
  domain/
    model/       # plain Java domain objects, no framework annotations
    exception/   # domain-specific exceptions (older modules only — see note below)
    port/in/     # use-case interfaces the module exposes (driven by web/etc.)
    port/out/    # interfaces the domain needs from infrastructure (persistence, encoding, ...)
    service/     # use-case implementations, depend only on port/out interfaces
  infrastructure/
    config/      # Spring @Configuration wiring domain services to their ports (manual `new`, not @Service)
    in/web/      # @RestController, DTOs (Java records), @RestControllerAdvice exception handler
    out/persistence/  # JPA entities, Spring Data repositories, MapStruct mappers, port adapters
```

Existing modules (roughly in dependency order — later ones depend on earlier ones' `port/out` interfaces):
`personnel` (Enseignant, Utilisateur — staff and system users), `session` (SessionAcademique, the academic-year
container almost everything else is scoped to), `centre`, `departement`, `matiere`, `formation`, `salle`,
`apprenant` (students), `affectation` (teaching-slot scheduling), `affectationdepartementale` (per-department
teacher roster per session), `rattachement` (attaching a `Utilisateur` to a `centre` with roles), `progression`
(curriculum tracking), `financier` (entrées/sorties, motifs, bilans journaliers, validation workflow), `dossier`
(admission concours, required pieces, a student's dossier and its financial paiement/solde tracking — depends on
`financier` for payments and on `session`/`apprenant`).

Key conventions to preserve when extending this:

- **Domain services are plain classes**, not Spring beans. They're instantiated manually inside an
  `infrastructure/config/*BeanConfiguration` class (e.g. `PersonnelBeanConfiguration`) and exposed only through their
  `port/in` interfaces. A module can have more than one `BeanConfiguration`/service pair when it has clearly separate
  sub-features (see `financier`, which has `FinancierBeanConfiguration`, `BilanJournalierBeanConfiguration`, and
  `ValidationMouvementBeanConfiguration` alongside `MouvementFinancierService`, `BilanJournalierService`,
  `ValidationMouvementService`, `MotifService`).
- **Cross-module composition happens in the domain layer, not just at wiring time**: a module's domain `service`
  routinely takes other modules' `port/out` repository interfaces as constructor dependencies (and reads their
  domain models) to validate invariants — e.g. `AffectationService` depends on `CentreRepositoryPort`,
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
  for list responses). Keep new endpoints consistent with this — check `Swagger UI` output when in doubt.
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

## Configuration notes

- `spring.jpa.hibernate.ddl-auto` defaults to `update` and Flyway is disabled by default (`FLYWAY_ENABLED:false`) —
  schema currently comes from Hibernate auto-DDL, not migrations, despite `flyway` dependencies being present in
  `pom.xml`.
- Datasource/server settings are all environment-variable driven with local defaults (`DB_HOST`, `DB_PORT:5433`,
  `DB_NAME:excelis_prepas`, `DB_USER`, `DB_PASSWORD`, `SERVER_PORT:8080`) — see `application.yaml` and
  `../docker-compose.yml`.
