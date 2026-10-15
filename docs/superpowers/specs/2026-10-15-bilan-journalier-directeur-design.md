# Spécification Technique & Fonctionnelle : Vue des Bilans Journaliers pour le Directeur

Ce document spécifie la conception et l'implémentation de la **vue consolidée des bilans journaliers de caisse dédiée au Directeur** (et aux rôles de supervision financière nationale) pour la plateforme **GESPREPAS (Excelis Prépa)**.

---

## 1. Contexte & Objectifs

### 1.1 Contexte
Actuellement, le module de clôture de caisse journalière (`/bilan-journalier`) prend en charge le cycle complet à 3 visas (Caissier ➔ Chef de Centre ➔ Comptable) à l'échelle d'un centre unique avec une fiche d'impression physique conforme au modèle officiel.
Pour un **Chef de Centre**, cette vue unitaire centrée sur son établissement physique est parfaitement adaptée.
En revanche, le **Directeur Général** et les contrôleurs nationaux ont besoin d'une vision d'ensemble consolidée pour suivre instantanément :
1. Les encaissements et décaissements de l'ensemble des centres pour la journée choisie.
2. Le statut de clôture de caisse de chaque centre (centres encore ouverts, soumis ou déjà visés/clôturés).
3. Les effectifs d'apprenants (nouveaux inscrits du jour et effectifs globaux par centre).
4. La capacité d'imprimer une **Fiche Récapitulative Nationale Officielle** (format A4) certifiant l'état global des caisses du réseau.
5. La possibilité d'accéder sans rupture de contexte au détail opérationnel d'un centre particulier pour y opérer des vérifications ou apposer un visa.

### 1.2 Objectifs
- Fournir un endpoint backend Spring Boot consolidé `GET /api/bilans-journaliers/consolide-du-jour` respectant l'architecture hexagonale.
- Offrir une interface utilisateur fluide sur `/bilan-journalier` avec deux onglets pour les utilisateurs à profil national (Directeur, Comptable) :
  - **Onglet 1 : « Synthèse nationale »** : Cartes KPIs globales, tableau comparatif multi-centres et bouton d'impression consolidée.
  - **Onglet 2 : « Détail par centre »** : Réutilisation directe de la vue opérationnelle existante (sans modification pour les chefs de centre).
- Implémenter une modale d'impression officielle haute fidélité `FicheSyntheseNationalePrintModal` au format A4 avec conversion des totaux en lettres et blocs d'émargement officiels.

---

## 2. Architecture Backend Spring Boot (Clean / Hexagonal)

### 2.1 Modèle de domaine
Fichiers dans `backend/src/main/java/com/excelisprepas/backend/financier/domain/model/` :
- `BilanConsolideNational.java` :
  - `LocalDate date`
  - `UUID sessionId`
  - `BigDecimal totalEntreesNational`
  - `BigDecimal totalSortiesNational`
  - `BigDecimal netAVerserNational`
  - `long totalNouveauxElevesNational`
  - `long totalEffectifNational`
  - `int centresCloturesCount`
  - `int centresTotalCount`
  - `List<BilanCentreResume> centres`
- `BilanCentreResume.java` :
  - `UUID centreId`
  - `String centreNom`
  - `String centreVille`
  - `StatutBilan statut` (`OUVERT`, `SOUMIS_CAISSIER`, `VISE_CHEF_CENTRE`, `CLOTURE`)
  - `BigDecimal totalEntrees`
  - `BigDecimal totalSorties`
  - `BigDecimal netAVerser`
  - `int effectifNouveauxEleves`
  - `int effectifTotalCentre`
  - `int nombreSalles`
  - `int nombreCours`
  - `String nomCaissier`, `LocalDateTime dateVisaCaissier`
  - `String nomChefCentre`, `LocalDateTime dateValidationChefCentre`
  - `String nomControleur`, `LocalDateTime dateValidationControleur`

### 2.2 Port d'entrée (Use Case)
Fichier `backend/src/main/java/com/excelisprepas/backend/financier/domain/port/in/ConsulterBilanConsolideDuJourUseCase.java` :
```java
package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.BilanConsolideNational;
import java.time.LocalDate;
import java.util.UUID;

public interface ConsulterBilanConsolideDuJourUseCase {
    BilanConsolideNational consulterBilanConsolide(UUID sessionId, LocalDate date);
}
```

### 2.3 Implémentation du service
Fichier `backend/src/main/java/com/excelisprepas/backend/financier/domain/service/BilanJournalierService.java` :
- `BilanJournalierService` implémente `ConsulterBilanConsolideDuJourUseCase`.
- Algorithme de `consulterBilanConsolide(UUID sessionId, LocalDate date)` :
  1. Valider la session active via `verifierSessionUtilisable(sessionId)`.
  2. Récupérer tous les centres existants via `centreRepository.findAll()`.
  3. Pour chaque centre :
     - Appeler la méthode interne `consulterBilanDuJour(centre.getId(), sessionId, date)`.
     - Construire un `BilanCentreResume` enrichi du nom et de la ville du centre.
  4. Cumuler les indicateurs nationaux :
     - `totalEntreesNational = sum(totalEntrees)`
     - `totalSortiesNational = sum(totalSorties)`
     - `netAVerserNational = totalEntreesNational - totalSortiesNational`
     - `totalNouveauxElevesNational = sum(effectifNouveauxEleves)`
     - `totalEffectifNational = sum(effectifTotalCentre)`
     - `centresCloturesCount = count(statut == CLOTURE)`
     - `centresTotalCount = centres.size()`
  5. Retourner l'instance `BilanConsolideNational`.

### 2.4 DTOs Web & Contrôleur REST
Fichiers dans `backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/in/web/` :
- `dto/BilanCentreResumeResponse.java` (record)
- `dto/BilanConsolideResponse.java` (record)
- `BilanJournalierController.java` :
  - Endpoint : `GET /api/bilans-journaliers/consolide-du-jour`
  - Paramètres : `@RequestParam UUID sessionId`, `@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date`
  - Sécurité : `@PreAuthorize("hasAuthority('FINANCIER_CONSULTER')")`
  - Réponse HTTP 200 : `BilanConsolideResponse`

---

## 3. Architecture Frontend Next.js / React

### 3.1 Contrats de données & Client API
- **Types (`frontend/src/modules/financier/domain/types.ts`)** :
  - `BilanCentreResume`
  - `BilanConsolideNational`
- **Client HTTP (`frontend/src/modules/financier/data/client.ts`)** :
  - `getBilanConsolideDuJour(sessionId: string, date: string): Promise<BilanConsolideNational>`
- **React Query Hook (`frontend/src/modules/financier/data/queries.ts`)** :
  - `useBilanConsolideDuJour(sessionId: string | undefined, date: string)`

### 3.2 Expérience Utilisateur sur `/bilan-journalier`
Fichier : `frontend/src/app/(dashboard)/bilan-journalier/BilanJournalierView.tsx`

1. **Détection du rôle** :
   - `estDirecteurOuControleur = user?.role === "DIRECTEUR" || user?.role === "COMPTABLE"`
   - Si `!estDirecteurOuControleur` (ex. Chef de centre, caissier) : rendu direct et exclusif de la vue par centre (aucun onglet affiché, expérience actuelle intacte).
2. **Double onglet pour le Directeur** :
   - **Onglet 1 : « Synthèse nationale »** *(sélectionné par défaut)*
   - **Onglet 2 : « Détail par centre »** *(avec sélecteur de centre interactif)*
3. **Composant Synthèse Nationale (`SyntheseNationaleView.tsx`)** :
   - **4 Cartes KPIs** :
     - *Recettes Nationales* (Entrées cumulées)
     - *Dépenses Nationales* (Sorties cumulées)
     - *Solde Net National* (Net en caisse)
     - *Clôtures Réseau* (Ratio ex: `3 / 3 clôturés`, badge couleur, total élèves)
   - **Bouton d'action supérieur** : « Imprimer la synthèse nationale » (ouvre la modale d'impression officielle).
   - **Tableau comparatif des centres** :
     - Colonnes : Centre, Ville, Statut (badge visuel), Entrées, Sorties, Net à verser, Activité (salles/cours/nouveaux), Dernier visa, Action.
     - Ligne de pied de tableau avec les totaux consolidés.
     - Bouton d'action **« Consulter / Gérer »** : bascule directement vers l'onglet « Détail par centre » avec l'ID du centre présélectionné.

### 3.3 Fiche d'Impression Officielle A4 (`FicheSyntheseNationalePrintModal.tsx`)
Composant dédié à l'impression haute fidélité (`@media print`) :
- En-tête officiel EXCELIS PREPAS avec logo, titre officiel, date et référence nationale (`NAT/JJ/MM/AAAA`).
- Tableau récapitulatif formel des centres avec ventilation Entrées, Sorties, Net et signataires.
- Ligne des totaux généraux en chiffres.
- Formulation formelle du total net arrêté en toutes lettres via `nombreEnLettres(netNational)`.
- Deux cadres d'émargement officiels : *Visa Contrôle / Comptabilité Générale* et *Visa Direction Générale*.

---

## 4. Sécurité & Droits d'Accès

| Rôle | Accès Synthèse Nationale | Accès Détail Centre | Saisie Mouvements | Visa Chef de Centre | Clôture Comptable |
|---|:---:|:---:|:---:|:---:|:---:|
| `DIRECTEUR` | **Oui** | **Oui (tous les centres)** | Non | Oui (supervision) | Oui (supervision) |
| `COMPTABLE` | **Oui** | **Oui (tous les centres)** | Non | Non | **Oui (définitif)** |
| `CHEF_CENTRE` | Non | **Oui (son centre uniquement)** | Oui | **Oui** | Non |
| `CAISSIER` | Non | **Oui (son centre uniquement)** | **Oui** | Non | Non |

---

## 5. Plan de Vérification & Tests

### 5.1 Tests Automatisés Backend
- **Test unitaire de service (`BilanJournalierServiceTest.java`)** :
  - Vérifier l'agrégation de 3 centres avec des montants d'entrées et de sorties variés.
  - Vérifier le calcul exact du nombre de centres clôturés vs ouverts.
  - Vérifier la gestion gracieuse en cas de centre sans aucun mouvement.
- **Test d'intégration Web (`BilanJournalierControllerTest.java`)** :
  - Vérifier l'appel à `GET /api/bilans-journaliers/consolide-du-jour` avec authentification valide (`FINANCIER_CONSULTER`).
  - Commande : `./mvnw test -Dtest=BilanJournalier*Test`.

### 5.2 Tests Automatisés Frontend
- Vérification TypeScript : `pnpm typecheck`
- Vérification Lint : `pnpm lint`

### 5.3 Validation Manuelle Visuelle
- Se connecter en tant que Directeur : vérifier la présence des 2 onglets.
- Naviguer entre les dates : s'assurer du rechargement réactif des totaux nationaux.
- Cliquer sur « Consulter » sur un centre du tableau : vérifier la bascule immédiate sur l'onglet de détail avec ce centre activé.
- Lancer l'impression de la fiche nationale : vérifier dans l'aperçu avant impression le respect strict du gabarit A4 et la conversion du montant en lettres.
