# Journalisation des Événements & Audit Métier - Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place un système complet de journalisation et d'audit métier asynchrone traçant les actions sensibles (Finances, Bilans Journaliers, Inscriptions) avec une interface de supervision `/audit` pour les directeurs et superviseurs.

**Architecture:** Événements applicatifs Spring (`ApplicationEventPublisher`) émis par les services métiers lors des actions clés, traités de manière asynchrone (`@Async`, transaction isolée `REQUIRES_NEW`) par un écouteur qui persiste les logs dans PostgreSQL (`audit_logs`) avec métadonnées JSONB. Exposition via une API REST sécurisée et restitution sur une page Next.js avec filtres dynamiques, pagination et modale d'inspection.

**Tech Stack:** Spring Boot 4 / Java 21, Spring Data JPA, PostgreSQL (JSONB & Flyway), Spring Security, Next.js 15 (App Router), React, TanStack Query, TailwindCSS, Lucide Icons.

**Spec:** `docs/superpowers/specs/2026-10-15-journalisation-audit-design.md`

## Global Constraints

- Backend : Java 21, Spring Boot 4, conventions DDD/Clean Architecture existantes dans le projet (`shared`, `financier`, `academie/bilan`, `apprenant`).
- L'écriture d'audit ne doit JAMAIS bloquer ni faire échouer l'action métier de l'utilisateur (asynchrone + résilience try/catch).
- Base de données : Migration Flyway numérotée `V30__table_audit_logs.sql`.
- Frontend : Types TypeScript stricts, composants UI réutilisables, pas de styles Tailwind inline ad-hoc qui dérogent au thème.
- Accès restreint : Seuls les rôles autorisés (`DIRECTEUR`, `DIRECTEUR_ACADEMIQUE`, `CHEF_CENTRE`) ont accès à l'API et à la page `/audit`.

## Review Focus

1. **Non-blocage transactionnel** : Une panne ou indisponibilité temporaire lors de l'enregistrement de l'audit ne doit jamais annuler la transaction de versement ou de visa.
2. **Contextes utilisateur anonymes ou système** : Si une action s'exécute sans contexte de sécurité actif (tâche planifiée, batch), le système doit enregistrer "Système" sans lancer de `NullPointerException`.
3. **Sécurité & masquage des données sensibles** : Aucun mot de passe, token ou clé secrète ne doit se retrouver dans le JSON `details`.
4. **Volume et performances d'interrogation** : Les index `(created_at DESC)`, `(centre_id)`, `(module)` doivent assurer des réponses sous 50ms sur des milliers d'entrées.
5. **Robustesse de la sérialisation JSON** : Les proxies Lazy JPA ne doivent jamais être passés directement dans `details` (uniquement des Maps de types primitifs/Strings).

---

### Task 1 : Schéma SQL & Entité JPA AuditLog

**Files:**
- Create: `backend/src/main/resources/db/migration/V30__table_audit_logs.sql`
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/domain/model/AuditLog.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/infrastructure/out/persistence/AuditLogRepository.java`
- Test: `backend/src/test/java/com/excelisprepas/backend/shared/audit/AuditLogRepositoryTest.java`

**Interfaces:**
- Produces: `AuditLog` entity, `AuditLogRepository extends JpaRepository<AuditLog, UUID>, JpaSpecificationExecutor<AuditLog>`

- [ ] **Step 1: Créer la migration Flyway `V30__table_audit_logs.sql`**
  Créer la table `audit_logs` avec colonnes `id`, `created_at`, `utilisateur_id`, `utilisateur_nom`, `utilisateur_email`, `utilisateur_role`, `centre_id`, `centre_nom`, `module`, `type_action`, `description`, `entite_type`, `entite_id`, `statut`, `details` (JSONB), `adresse_ip` et les index associés.

- [ ] **Step 2: Créer le test repository `AuditLogRepositoryTest`**
  Test vérifiant la persistance d'une entité `AuditLog` avec son contenu JSONB et sa relecture.

- [ ] **Step 3: Implémenter l'entité `AuditLog` et l'interface `AuditLogRepository`**
  Définir l'entité JPA avec mapping `@JdbcTypeCode(SqlTypes.JSON)` pour le champ `details` (Map<String, Object> ou String) et UUID id.

- [ ] **Step 4: Exécuter le test repository**
  Run: `./mvnw test -Dtest=AuditLogRepositoryTest`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add backend/src/main/resources/db/migration/V30__table_audit_logs.sql backend/src/main/java/com/excelisprepas/backend/shared/audit/
  git commit -m "feat(audit): table Flyway V30 et entite AuditLog JPA"
  ```

---

### Task 2 : Core Événements, Publisher Helper & Listener Asynchrone

**Files:**
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/domain/event/AuditLogEvent.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/domain/event/AuditModule.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/application/AuditEventHelper.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/infrastructure/in/listener/AuditLogListener.java`
- Test: `backend/src/test/java/com/excelisprepas/backend/shared/audit/AuditLogListenerTest.java`

**Interfaces:**
- Produces: `AuditEventHelper.audit(AuditModule module, String typeAction, String description, String entiteType, String entiteId, Map<String, Object> details)`
- Produces: `AuditLogListener.onAuditLogEvent(AuditLogEvent event)` annoté `@Async`

- [ ] **Step 1: Écrire le test unitaire pour `AuditLogListener`**
  Vérifier que la réception d'un `AuditLogEvent` persiste correctement un `AuditLog` via `AuditLogRepository` et attrape les exceptions sans propagation.

- [ ] **Step 2: Implémenter `AuditModule` et `AuditLogEvent` (Record)**
  Définir les enums (`FINANCE`, `BILAN_JOURNALIER`, `INSCRIPTION`, `PAIE`, `ADMINISTRATION`) et le Record `AuditLogEvent`.

- [ ] **Step 3: Implémenter `AuditEventHelper`**
  Service utilitaire extrayant l'utilisateur connecté depuis `SecurityContextHolder` (nom, rôle, email, centre) et publiant l'événement via `ApplicationEventPublisher`.

- [ ] **Step 4: Implémenter `AuditLogListener`**
  Listener avec `@Async` et `@Transactional(propagation = Propagation.REQUIRES_NEW)`.

- [ ] **Step 5: Exécuter les tests unitaires**
  Run: `./mvnw test -Dtest=AuditLogListenerTest`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/main/java/com/excelisprepas/backend/shared/audit/
  git commit -m "feat(audit): événements de domaine, helper et listener asynchrone"
  ```

---

### Task 3 : API REST de Consultation & Spécifications de Filtrage

**Files:**
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/infrastructure/in/web/AuditLogController.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/infrastructure/in/web/dto/AuditLogResponseDto.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/infrastructure/out/persistence/AuditLogSpecification.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/shared/audit/application/AuditLogQueryService.java`
- Test: `backend/src/test/java/com/excelisprepas/backend/shared/audit/AuditLogControllerTest.java`

**Interfaces:**
- Produces: `GET /api/audit-logs?page=0&size=20&module=FINANCE&centreId=...&recherche=...`
- Consumes: `AuditLogRepository`, Spring Security

- [ ] **Step 1: Écrire le test d'API `AuditLogControllerTest` (MockMvc)**
  Tester l'accès `GET /api/audit-logs` avec un utilisateur ayant le rôle `DIRECTEUR` (200 OK) et un utilisateur non autorisé (403 Forbidden).

- [ ] **Step 2: Implémenter `AuditLogSpecification` pour le filtrage dynamique JPA**
  Critères de recherche : `module`, `centreId`, `utilisateurId`, plage de dates (`dateDebut` / `dateFin`), et `recherche` (match `description` ou `utilisateurNom`).

- [ ] **Step 3: Implémenter `AuditLogQueryService` et `AuditLogResponseDto`**
  Service qui applique la spécification et retourne une `Page<AuditLogResponseDto>`.

- [ ] **Step 4: Implémenter `AuditLogController`**
  Exposer `GET /api/audit-logs` sécurisé par `@PreAuthorize("hasAnyRole('DIRECTEUR', 'DIRECTEUR_ACADEMIQUE', 'CHEF_CENTRE')")`.

- [ ] **Step 5: Exécuter le test du Controller**
  Run: `./mvnw test -Dtest=AuditLogControllerTest`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/main/java/com/excelisprepas/backend/shared/audit/
  git commit -m "feat(audit): API REST de consultation et filtrage paginé"
  ```

---

### Task 4 : Déclencheurs d'Audit - Module Finances & Ventes de Livres

**Files:**
- Modify: Services financiers existants (versements bancaires, mouvements de caisse)
- Modify: `backend/src/main/java/com/excelisprepas/backend/livre/service/VenteLivreService.java`
- Test: `backend/src/test/java/com/excelisprepas/backend/financier/FinanceAuditIntegrationTest.java`

**Interfaces:**
- Consumes: `AuditEventHelper`

- [ ] **Step 1: Écrire le test d'intégration financier**
  Vérifier que la validation d'un versement émet bien l'événement d'audit `CREATION_VERSEMENT`.

- [ ] **Step 2: Injecter `AuditEventHelper` dans la gestion des versements bancaires**
  Tracer `CREATION_VERSEMENT` avec montant, banque, numéro de bordereau, nom de l'apprenant.

- [ ] **Step 3: Injecter `AuditEventHelper` dans les mouvements de caisse et dépenses**
  Tracer `ENTREE_CAISSE` et `SORTIE_CAISSE` avec montant, motif et centre.

- [ ] **Step 4: Injecter `AuditEventHelper` dans `VenteLivreService`**
  Tracer `VENTE_LIVRE` avec quantité, titre du livre, montant total, nom de l'acheteur.

- [ ] **Step 5: Exécuter les tests financiers**
  Run: `./mvnw test -Dtest=*Finance*Test`
  Expected: PASS

- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/main/java/com/excelisprepas/backend/financier/ backend/src/main/java/com/excelisprepas/backend/livre/
  git commit -m "feat(audit): intégration de la traçabilité sur les finances et ventes de livres"
  ```

---

### Task 5 : Déclencheurs d'Audit - Module Bilans Journaliers

**Files:**
- Modify: Services de bilan journalier (`backend/src/main/java/com/excelisprepas/backend/academie/bilan/`)
- Test: `backend/src/test/java/com/excelisprepas/backend/academie/bilan/BilanJournalierAuditTest.java`

**Interfaces:**
- Consumes: `AuditEventHelper`

- [ ] **Step 1: Écrire le test d'audit pour les visas de bilan**
  Vérifier qu'un visa directeur émet l'audit avec le bon libellé et l'ID du bilan.

- [ ] **Step 2: Injecter `AuditEventHelper` dans l'apposition des visas**
  Tracer `VISA_DIRECTEUR`, `VISA_COMPTABLE`, `VISA_SUPERVISEUR` avec statut, date du bilan et centre.

- [ ] **Step 3: Injecter `AuditEventHelper` lors de la soumission / clôture du bilan**
  Tracer `CLOTURE_BILAN` avec totaux déclarés.

- [ ] **Step 4: Exécuter les tests de bilan**
  Run: `./mvnw test -Dtest=BilanJournalierAuditTest`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add backend/src/main/java/com/excelisprepas/backend/academie/bilan/
  git commit -m "feat(audit): traçabilité des visas et clôtures de bilans journaliers"
  ```

---

### Task 6 : Déclencheurs d'Audit - Module Apprenants & Inscriptions

**Files:**
- Modify: Services apprenants & inscriptions (`backend/src/main/java/com/excelisprepas/backend/apprenant/` et `inscription/`)
- Test: `backend/src/test/java/com/excelisprepas/backend/apprenant/ApprenantAuditTest.java`

**Interfaces:**
- Consumes: `AuditEventHelper`

- [ ] **Step 1: Écrire le test d'audit apprenant**
  Vérifier qu'une création d'apprenant ou de contrat de formation publie l'audit adéquat.

- [ ] **Step 2: Injecter `AuditEventHelper` dans la création de la fiche apprenant**
  Tracer `CREATION_APPRENANT` avec matricule, nom, prénom, centre d'inscription.

- [ ] **Step 3: Injecter `AuditEventHelper` dans la création / modification du contrat de formation**
  Tracer `CREATION_CONTRAT` ou `MODIFICATION_CONTRAT` avec montant total, remises accordées, échéancier.

- [ ] **Step 4: Exécuter les tests apprenants**
  Run: `./mvnw test -Dtest=ApprenantAuditTest`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add backend/src/main/java/com/excelisprepas/backend/apprenant/ backend/src/main/java/com/excelisprepas/backend/inscription/
  git commit -m "feat(audit): traçabilité de la création d'apprenants et contrats"
  ```

---

### Task 7 : Client API Frontend & Types TypeScript

**Files:**
- Create: `frontend/src/types/audit.ts`
- Create: `frontend/src/modules/audit/data/api.ts`
- Create: `frontend/src/modules/audit/data/queries.ts`

**Interfaces:**
- Produces: `useAuditLogsQuery(filters: AuditLogFilters)`
- Types: `AuditLogItem`, `AuditLogFilters`, `PaginatedAuditLogs`

- [ ] **Step 1: Créer le fichier de types `frontend/src/types/audit.ts`**
  Définir `AuditLogItem`, `AuditModule`, `AuditLogFilters`, `AuditDetails`.

- [ ] **Step 2: Implémenter les appels API dans `frontend/src/modules/audit/data/api.ts`**
  Méthode `fetchAuditLogs(params: AuditLogFilters): Promise<PaginatedAuditLogs>`.

- [ ] **Step 3: Implémenter les hooks React Query dans `queries.ts`**
  `useAuditLogsQuery` avec support de pagination, cache et refetch automatique.

- [ ] **Step 4: Vérifier la compilation TypeScript**
  Run: `pnpm --filter frontend type-check` ou `pnpm build --dry-run`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/types/audit.ts frontend/src/modules/audit/
  git commit -m "feat(audit): client API et hooks React Query pour l'audit"
  ```

---

### Task 8 : Interface Frontend `/audit` & Composants de Supervision

**Files:**
- Create: `frontend/src/app/(dashboard)/audit/page.tsx`
- Create: `frontend/src/modules/audit/components/AuditFiltersBar.tsx`
- Create: `frontend/src/modules/audit/components/AuditLogsTable.tsx`
- Create: `frontend/src/modules/audit/components/AuditDetailsDialog.tsx`
- Modify: `frontend/src/shared/layout/nav-items.ts:40-52`

**Interfaces:**
- Produces: Route `/audit` accessible pour les directeurs et superviseurs

- [ ] **Step 1: Ajouter l'élément de navigation dans `nav-items.ts`**
  Ajouter `{ href: "/audit", label: "Journal d'audit", icon: ShieldCheck }` pour les rôles habilités.

- [ ] **Step 2: Créer la barre de filtres `AuditFiltersBar.tsx`**
  Composant avec recherche texte avec debounce, filtres par module, centre, et période de dates.

- [ ] **Step 3: Créer la boîte de dialogue de détails `AuditDetailsDialog.tsx`**
  Afficher l'événement sélectionné, l'auteur, l'adresse IP, le statut et les métadonnées JSON sous forme de fiches lisibles.

- [ ] **Step 4: Créer le tableau `AuditLogsTable.tsx` et la page `page.tsx`**
  Afficher la liste avec badges de couleurs par module, date formatée, pagination serveur, et états de chargement / vide.

- [ ] **Step 5: Vérifier la navigation et le rendu visuel**
  Tester la page sur `http://localhost:3000/audit`.

- [ ] **Step 6: Commit**
  ```bash
  git add frontend/src/app/\(dashboard\)/audit/ frontend/src/modules/audit/ frontend/src/shared/layout/nav-items.ts
  git commit -m "feat(audit): page de supervision /audit avec filtres et modale détails"
  ```

---

### Task 9 : Validation Bout-en-Bout & Export CSV

**Files:**
- Create: `frontend/src/modules/audit/utils/exportCsv.ts`
- Modify: `frontend/src/modules/audit/components/AuditFiltersBar.tsx` (bouton export)

- [ ] **Step 1: Implémenter l'utilitaire d'export CSV `exportCsv.ts`**
  Exporter les événements d'audit actuellement filtrés avec en-têtes français clairs.

- [ ] **Step 2: Valider le flux complet**
  Effectuer une action dans l'application (ex: versement ou visa), ouvrir `/audit`, vérifier l'apparition instantanée de la ligne d'événement et le contenu du snapshot JSON.

- [ ] **Step 3: Commit final**
  ```bash
  git add frontend/src/modules/audit/
  git commit -m "feat(audit): export CSV et validation complète de la traçabilité"
  ```
