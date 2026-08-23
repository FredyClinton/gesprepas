# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Spring Boot 4.1.1 / Java 21 backend for EXCELIS PRÉPAS, a multi-center school management system. This `backend/` directory is a subproject of a larger repo rooted at `../` (git root is `../`, not here) — `../docker-compose.yml` provisions the Postgres database and `../.env` supplies datasource credentials (loaded via `spring.config.import: optional:file:../.env[.properties]` in `application.yaml`).

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

The codebase follows **hexagonal architecture (ports & adapters)**, organized by business module rather than technical layer. Currently there is one module, `personnel`, under `src/main/java/com/excelisprepas/backend/personnel/`, plus a `shared/` package for cross-cutting config (e.g. `shared/config/OpenApiConfig.java`). New business modules should follow the same package shape:

```
<module>/
  domain/
    model/       # plain Java domain objects, no framework annotations
    exception/   # domain-specific exceptions
    port/in/     # use-case interfaces the module exposes (driven by web/etc.)
    port/out/    # interfaces the domain needs from infrastructure (persistence, encoding, ...)
    service/     # use-case implementations, depend only on port/out interfaces
  infrastructure/
    config/      # Spring @Configuration wiring domain services to their ports (manual `new`, not @Service)
    in/web/      # @RestController, DTOs (Java records), @RestControllerAdvice exception handlers
    out/persistence/  # JPA entities, Spring Data repositories, MapStruct mappers, port adapters
```

Key conventions to preserve when extending this:

- **Domain services are plain classes**, not Spring beans. They're instantiated manually inside an `infrastructure/config/*BeanConfiguration` class (e.g. `PersonnelBeanConfiguration`) and exposed only through their `port/in` interface. Domain code has zero Spring/JPA/Jakarta dependencies.
- **Domain models are framework-free** and self-validating: constructors/setters throw `IllegalArgumentException`/`NullPointerException` on invalid state (see `Personnel`, `Enseignant`, `Utilisateur`). `Personnel` is an abstract base class; `Enseignant` and `Utilisateur` extend it and fix their `ModeCalculPaie` (`PAR_SEANCE` vs `FIXE`).
- **Persistence uses class-table inheritance**: `PersonnelEntity` is `@Entity` with `@Inheritance(strategy = InheritanceType.JOINED)`; `EnseignantEntity` extends it (backed by an `enseignants` table joined to `personnel`). A `Utilisateur` entity/table would follow the same pattern.
- **MapStruct** (`componentModel = "spring"`) maps between domain models and JPA entities in `*PersistenceMapper` interfaces; adapters (`*RepositoryAdapter`) implement the `domain/port/out` repository interface using the JPA repository + mapper.
- **Web layer**: controllers depend only on `port/in` use-case interfaces (never on domain services directly), use `@Valid @RequestBody` records for input, and translate domain exceptions to HTTP responses via a module-level `@RestControllerAdvice` (`PersonnelExceptionHandler`) returning a `Map`-based error body (`timestamp`, `status`, `error`, `message`).
- **Domain/business text (field names, validation messages, entity/exception names) is in French**; keep new domain code consistent with this.

Tests mirror the module structure under `src/test/java`, one test class per production class, using JUnit 5 + Mockito for domain/service/controller tests (`@WebMvcTest` for controllers with `@MockitoBean` for the use-case) and Testcontainers/`@DataJpaTest`-style tests for the persistence adapter layer.

## Configuration notes

- `spring.jpa.hibernate.ddl-auto` defaults to `update` and Flyway is disabled by default (`FLYWAY_ENABLED:false`) — schema currently comes from Hibernate auto-DDL, not migrations, despite `flyway` dependencies being present in `pom.xml`.
- Datasource/server settings are all environment-variable driven with local defaults (`DB_HOST`, `DB_PORT:5433`, `DB_NAME:excelis_prepas`, `DB_USER`, `DB_PASSWORD`, `SERVER_PORT:8080`) — see `application.yaml` and `../docker-compose.yml`.
