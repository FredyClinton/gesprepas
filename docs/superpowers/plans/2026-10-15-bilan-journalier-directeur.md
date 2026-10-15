# Vue Bilan Journalier Directeur Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implémenter la vue consolidée des bilans journaliers pour le Directeur Général (et la comptabilité) dans GESPREPAS, incluant le endpoint backend dédié avec ventilation par formation (recettes et effectifs) et par motif de dépenses, l'interface à double onglet avec tableau dépliable multi-centres, et la fiche officielle imprimable A4.

**Architecture:** Architecture hexagonale côté backend Spring Boot 3 (Use Case `ConsulterBilanConsolideDuJourUseCase`, agrégation des flux financiers et des effectifs par filière, endpoint REST sécurisé) et frontend Next.js 16 / React 19 modulaire (types, TanStack Query, vue de synthèse nationale avec accordéon interactif, modale d'impression officielle `@media print`).

**Tech Stack:** Java 21, Spring Boot 3, Spring Data JPA, PostgreSQL, Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, TanStack Query v5.

**Spec:** [`docs/superpowers/specs/2026-10-15-bilan-journalier-directeur-design.md`](file:///home/ghost/Documents/EXCELIS/gesprepas/docs/superpowers/specs/2026-10-15-bilan-journalier-directeur-design.md)

## Global Constraints
- Clean Architecture (Hexagonal) : Séparation stricte entre domaine, ports et adaptateurs d'infrastructure sans annotations Spring dans le domaine.
- Sécurité : Endpoint protégé par `@PreAuthorize("hasAuthority('FINANCIER_CONSULTER')")`.
- Isolation des rôles : La vue Chef de Centre reste 100% opérationnelle et unitaire sans tabs superflus ; les onglets Synthèse/Détail sont réservés à `DIRECTEUR` et `COMPTABLE`.
- Rigueur financière : Conversion du montant net en toutes lettres sur la fiche imprimable via `nombreEnLettres`.
- Format A4 Portrait/Paysage normalisé pour l'impression haute fidélité.

## Review Focus
- Centre actif sans aucun mouvement ni inscription : doit retourner des listes vides et 0 FCFA sans erreur NullPointer.
- Entrées sans formation associée (ex: vente de livres, frais de concours) : correctement classées sous la catégorie `"AUTRE"` et prises en compte dans les totaux.
- Date sans aucune séance planifiée ou jour férié : `nombreSalles` et `nombreCours` valorisés à 0 sans crash.
- Bascule fluide entre Synthèse nationale et Détail : cliquer sur « Consulter » sur un centre pré-sélectionne ce centre et affiche son détail sans recharger la page.
- Typage strict TypeScript & ESLint zéro avertissement.

---

### Task 1: Modèle de Domaine & Port d'Entrée Backend

**Files:**
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/domain/model/LigneEntreeResume.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/domain/model/LigneSortieResume.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/domain/model/EffectifFormationResume.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/domain/model/BilanCentreResume.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/domain/model/BilanConsolideNational.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/domain/port/in/ConsulterBilanConsolideDuJourUseCase.java`

**Interfaces:**
- Produces: `ConsulterBilanConsolideDuJourUseCase.consulterBilanConsolide(UUID sessionId, LocalDate date) -> BilanConsolideNational`

- [ ] **Step 1: Créer les modèles de domaine de ventilation et de synthèse**
  Créer `LigneEntreeResume` (categorie, formationId, libelle, montant, nombreOperations), `LigneSortieResume` (motifId, libelleMotif, montant, nombreOperations), et `EffectifFormationResume` (formationId, formationNom, nouveauxElevesJour, effectifTotal).

- [ ] **Step 2: Créer les agrégats de domaine `BilanCentreResume` et `BilanConsolideNational`**
  Implémenter les getters et constructeurs immuables / records sans dépendances Spring.

- [ ] **Step 3: Définir l'interface `ConsulterBilanConsolideDuJourUseCase`**
  Dans `domain/port/in/ConsulterBilanConsolideDuJourUseCase.java`.

- [ ] **Step 4: Compiler le domaine**
  Exécuter `./mvnw compile` pour vérifier l'absence d'erreurs de syntaxe ou d'import.

- [ ] **Step 5: Commit**
  ```bash
  git add backend/src/main/java/com/excelisprepas/backend/financier/domain/
  git commit -m "feat(financier): ajouter les modeles de domaine et use case pour le bilan consolide directeur"
  ```

---

### Task 2: Service Domaine & Logique d'Agrégation Multi-Centres (TDD)

**Files:**
- Modify: `backend/src/main/java/com/excelisprepas/backend/financier/domain/service/BilanJournalierService.java`
- Modify: `backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/config/FinancierBeanConfiguration.java`
- Test: `backend/src/test/java/com/excelisprepas/backend/financier/domain/service/BilanJournalierServiceTest.java`

**Interfaces:**
- Consumes: `ConsulterBilanConsolideDuJourUseCase`, `CentreRepositoryPort`, `FormationRepositoryPort`, `ApprenantRepositoryPort`, `EntreeRepositoryPort`, `SortieRepositoryPort`, `MotifRepositoryPort`
- Produces: Calcul complet du `BilanConsolideNational` avec entrées/sorties ventilées et effectifs par formation.

- [ ] **Step 1: Écrire le test unitaire échouant dans `BilanJournalierServiceTest`**
  Ajouter `testConsulterBilanConsolideDuJour()` simulant 2 centres avec mouvements d'entrées (dont une formation et un livre), mouvements de sorties par motif, et apprenants par filière.

- [ ] **Step 2: Exécuter le test pour vérifier son échec**
  Exécuter `./mvnw test -Dtest=BilanJournalierServiceTest#testConsulterBilanConsolideDuJour` (doit échouer car la méthode n'est pas encore implémentée).

- [ ] **Step 3: Implémenter `consulterBilanConsolide` dans `BilanJournalierService`**
  - Injecter `FormationRepositoryPort` (ou port existant) si nécessaire.
  - Parcourir tous les centres via `centreRepository.findAll()`.
  - Pour chaque centre : calculer totaux, grouper entrées par formation / livres, grouper sorties par motif, et compter effectifs (nouveaux et total) par formation.
  - Agréger les totaux nationaux (`totalEntreesNational`, `totalSortiesNational`, `netAVerserNational`, ventilation nationale, ratio centres clôturés).

- [ ] **Step 4: Mettre à jour `FinancierBeanConfiguration.java`**
  S'assurer que le bean `BilanJournalierService` est correctement injecté avec toutes les dépendances requises.

- [ ] **Step 5: Exécuter les tests unitaires et vérifier le passage au vert**
  Exécuter `./mvnw test -Dtest=BilanJournalierServiceTest`.

- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/main/java/com/excelisprepas/backend/financier/ backend/src/test/java/
  git commit -m "feat(financier): implementer le calcul du bilan consolide national dans BilanJournalierService"
  ```

---

### Task 3: DTOs Web & Contrôleur REST Backend (TDD)

**Files:**
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/in/web/dto/LigneEntreeResumeResponse.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/in/web/dto/LigneSortieResumeResponse.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/in/web/dto/EffectifFormationResumeResponse.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/in/web/dto/BilanCentreResumeResponse.java`
- Create: `backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/in/web/dto/BilanConsolideResponse.java`
- Modify: `backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/in/web/BilanJournalierController.java`
- Test: `backend/src/test/java/com/excelisprepas/backend/financier/infrastructure/in/web/BilanJournalierControllerTest.java`

**Interfaces:**
- Produces: `GET /api/bilans-journaliers/consolide-du-jour?sessionId={sessionId}&date={date}` -> HTTP 200 `BilanConsolideResponse`

- [ ] **Step 1: Écrire le test d'intégration MockMvc échouant**
  Ajouter un test dans `BilanJournalierControllerTest` simulant l'appel `GET /api/bilans-journaliers/consolide-du-jour` avec autorisation `FINANCIER_CONSULTER`.

- [ ] **Step 2: Exécuter le test pour vérifier l'échec 404**
  Exécuter `./mvnw test -Dtest=BilanJournalierControllerTest`.

- [ ] **Step 3: Créer les records DTOs de réponse JSON**
  Créer `LigneEntreeResumeResponse`, `LigneSortieResumeResponse`, `EffectifFormationResumeResponse`, `BilanCentreResumeResponse`, et `BilanConsolideResponse`.

- [ ] **Step 4: Ajouter le endpoint dans `BilanJournalierController.java`**
  Injecter `ConsulterBilanConsolideDuJourUseCase` et implémenter `consulterBilanConsolideDuJour(@RequestParam UUID sessionId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date)`.

- [ ] **Step 5: Exécuter les tests du contrôleur et valider le passage au vert**
  Exécuter `./mvnw test -Dtest=BilanJournalierControllerTest`.

- [ ] **Step 6: Commit**
  ```bash
  git add backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/in/web/ backend/src/test/
  git commit -m "feat(financier): exposer le endpoint REST consolide-du-jour pour le directeur"
  ```

---

### Task 4: Contrats TypeScript, Client API & Hooks Frontend

**Files:**
- Modify: `frontend/src/modules/financier/domain/types.ts`
- Modify: `frontend/src/modules/financier/data/client.ts`
- Modify: `frontend/src/modules/financier/data/queries.ts`

**Interfaces:**
- Produces: `useBilanConsolideDuJour(sessionId, date)` hook TanStack Query retournant `BilanConsolideNational`

- [ ] **Step 1: Déclarer les interfaces TypeScript dans `types.ts`**
  Ajouter `LigneEntreeResume`, `LigneSortieResume`, `EffectifFormationResume`, `BilanCentreResume` et `BilanConsolideNational`.

- [ ] **Step 2: Ajouter la fonction API cliente dans `client.ts`**
  Implémenter `getBilanConsolideDuJour(sessionId: string, date: string): Promise<BilanConsolideNational>` appelant `/api/bilans-journaliers/consolide-du-jour`.

- [ ] **Step 3: Ajouter le hook TanStack Query dans `queries.ts`**
  Implémenter `useBilanConsolideDuJour(sessionId: string | undefined, date: string)` avec clé de cache `["bilan-consolide", sessionId, date]`.

- [ ] **Step 4: Valider les types TypeScript**
  Exécuter `pnpm typecheck` dans `frontend/`.

- [ ] **Step 5: Commit**
  ```bash
  git add frontend/src/modules/financier/
  git commit -m "feat(frontend): ajouter types et hook useBilanConsolideDuJour"
  ```

---

### Task 5: Fiche d'Impression Officielle A4 Nationale (`FicheSyntheseNationalePrintModal.tsx`)

**Files:**
- Create: `frontend/src/modules/financier/components/FicheSyntheseNationalePrintModal.tsx`
- Modify: `frontend/src/modules/financier/index.ts` (export)

**Interfaces:**
- Consumes: `BilanConsolideNational`, `nombreEnLettres`
- Produces: Modale d'aperçu et d'impression `@media print` A4 avec en-tête EXCELIS, tableaux de centres, entrées par formation/livres, sorties par motif, effectifs, totaux en lettres, UBA et visas Direction.

- [ ] **Step 1: Créer le composant `FicheSyntheseNationalePrintModal.tsx`**
  - En-tête EXCELIS PREPAS avec référence `NAT/JJ/MM/AAAA`.
  - Tableau 1 : Récapitulatif National des Caisses par Centre.
  - Tableau 2 : Ventilation des Entrées (par Formation et Livres/Autres).
  - Tableau 3 : Ventilation des Sorties par Motif de Décaissement.
  - Tableau 4 : Répartition des Effectifs par Filière.
  - Totaux consolidés en chiffres et en lettres (`nombreEnLettres(netNational)`).
  - Blocs officiels de Visas : *Contrôle / Comptabilité* et *Direction Générale*.

- [ ] **Step 2: Exporter dans le baril `frontend/src/modules/financier/index.ts`**

- [ ] **Step 3: Vérifier le typage TypeScript**
  Exécuter `pnpm typecheck` dans `frontend/`.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/modules/financier/
  git commit -m "feat(frontend): creer la modale d'impression officielle A4 FicheSyntheseNationalePrintModal"
  ```

---

### Task 6: Vue Synthèse Nationale & Intégration des Onglets dans `/bilan-journalier`

**Files:**
- Create: `frontend/src/app/(dashboard)/bilan-journalier/SyntheseNationaleView.tsx`
- Modify: `frontend/src/app/(dashboard)/bilan-journalier/BilanJournalierView.tsx`

**Interfaces:**
- Consumes: `useBilanConsolideDuJour`, `FicheSyntheseNationalePrintModal`
- Produces: Écran complet avec onglets « Synthèse nationale » et « Détail par centre » pour le Directeur, avec lignes accordéon dépliables (entrées, sorties, effectifs) et bouton de bascule vers le détail du centre.

- [ ] **Step 1: Créer `SyntheseNationaleView.tsx`**
  - 4 cartes KPIs de synthèse nationale (Entrées, Sorties, Net en caisse, Ratio clôtures & effectifs).
  - Bouton supérieur « Imprimer la synthèse nationale ».
  - Tableau interactif des centres avec lignes dépliables accordéon :
    - Volet Entrées : Recettes par filière & livres.
    - Volet Sorties : Dépenses par motif.
    - Volet Effectifs : Nouveaux élèves & effectif total par filière.
    - Bouton contextuel « Consulter / Gérer » appelant le callback de bascule vers le détail.
  - Section de ventilation consolidée globale du réseau.

- [ ] **Step 2: Intégrer les onglets dans `BilanJournalierView.tsx`**
  - Détecter le rôle de l'utilisateur : `estDirecteurOuControleur = user?.role === "DIRECTEUR" || user?.role === "COMPTABLE"`.
  - Si utilisateur normal (Chef de Centre, Caissier) : afficher directement la vue unitaire existante sans tabs.
  - Si Directeur/Comptable : afficher le bandeau supérieur d'onglets (« Synthèse nationale » / « Détail par centre »).
  - Synchroniser la sélection de centre lors du clic sur « Consulter » dans le tableau national.

- [ ] **Step 3: Vérification TypeScript et Lint**
  Exécuter `pnpm typecheck && pnpm lint` dans `frontend/`.

- [ ] **Step 4: Commit**
  ```bash
  git add frontend/src/app/\(dashboard\)/bilan-journalier/
  git commit -m "feat(frontend): integrer SyntheseNationaleView et la navigation par onglets pour le directeur"
  ```

---

### Task 7: Vérification Complète & Validation de Bout en Bout

**Files:**
- Tests de non-régression et d'intégration

- [ ] **Step 1: Exécuter tous les tests backend financiers**
  Run: `./mvnw test -Dtest=BilanJournalier*Test,MouvementFinancier*Test`
  Expected: Tous les tests passent avec succès (BUILD SUCCESS).

- [ ] **Step 2: Vérifier le build frontend**
  Run: `pnpm build` ou `pnpm typecheck && pnpm lint` dans `frontend/`.
  Expected: Aucun avertissement ni erreur de type.

- [ ] **Step 3: Validation visuelle du flux Directeur**
  - Ouvrir `/bilan-journalier` avec profil Directeur : vérifier l'affichage par défaut de la « Synthèse nationale ».
  - Déplier les volets d'un centre : vérifier les sous-tableaux Entrées (formations/livres), Sorties (motifs), Effectifs.
  - Cliquer sur « Consulter » sur un centre : vérifier la transition instantanée sur l'onglet « Détail par centre » avec ce centre actif.
  - Cliquer sur « Imprimer la synthèse nationale » : vérifier la mise en page A4 et les montants en lettres.

- [ ] **Step 4: Commit final et validation**
  ```bash
  git commit -m "feat(bilan-journalier): finaliser la vue consolidee des bilans journaliers pour le directeur"
  ```
