# Spécification Technique & Fonctionnelle : Vue des Bilans Journaliers pour le Directeur

Ce document spécifie la conception et l'implémentation de la **vue consolidée des bilans journaliers de caisse dédiée au Directeur** (et aux rôles de supervision financière nationale) pour la plateforme **GESPREPAS (Excelis Prépa)**, avec une ventilation granulaire par formation, postes de recettes (livres, etc.), motifs de dépenses et effectifs d'apprenants.

---

## 1. Contexte & Objectifs

### 1.1 Contexte
Actuellement, le module de clôture de caisse journalière (`/bilan-journalier`) prend en charge le cycle d'approbation à 3 visas (Caissier ➔ Chef de Centre ➔ Comptable) au niveau d'un centre individuel avec une fiche physique officielle.
Pour un **Chef de Centre**, cette vue unitaire centrée sur son établissement physique est celle en place.
Pour le **Directeur Général**, la direction pédagogique et les contrôleurs financiers nationaux, la supervision exige une vue consolidée où chaque centre détaille ses composantes opérationnelles du jour :
1. **Entrées ventilées** :
   - Recettes par **formation / filière** (Polytechnique, Médecine, Commerce, etc.) avec montants et effectifs payeurs.
   - Recettes des **autres postes** (Vente de livres & supports pédagogiques, dossiers de concours, etc.).
2. **Sorties ventilées** :
   - Dépenses ordonnancées ventilées par **motif de décaissement** (fournitures, logistique, transports, reprographie, vacations, etc.) avec leurs montants.
3. **Effectifs détaillés par formation** :
   - Nouveaux apprenants inscrits le jour J pour chaque filière.
   - Effectif total d'apprenants actifs pour chaque filière du centre.
4. **Indicateurs opérationnels & clôtures** :
   - Statut de clôture de chaque caisse (`OUVERT`, `SOUMIS_CAISSIER`, `VISE_CHEF_CENTRE`, `CLOTURE`).
   - Salles occupées et cours dispensés.
5. **Édition & Impression Officielle A4** :
   - Capacité d'imprimer la **Fiche Récapitulative Nationale Officielle** (format A4) certifiant l'état des caisses de tout le réseau avec totaux en chiffres et en lettres et visas de direction.
6. **Navigation & Supervision sans rupture** :
   - Basculer en un clic depuis le tableau consolidé vers la fiche unitaire détaillée d'un centre pour consultation ou visa.

---

## 2. Architecture Backend Spring Boot (Clean / Hexagonal)

### 2.1 Modèle de domaine
Fichiers dans `backend/src/main/java/com/excelisprepas/backend/financier/domain/model/` :

#### `LigneEntreeResume.java` (record ou classe domaine)
Représente une ligne agrégée de recette du jour :
- `String categorie` : `"FORMATION"` ou `"AUTRE"` (ex: `"LIVRES"`, `"DOSSIERS"`)
- `UUID formationId` : ID de la formation (null si hors formation spécifique)
- `String libelle` : Nom de la formation ou du motif (ex: *"Prépa Ingénieurs (Polytech)"*, *"Vente Ouvrages & Annales"*)
- `BigDecimal montant` : Montant total collecté pour cette ligne
- `int nombreOperations` : Nombre de transactions enregistrées

#### `LigneSortieResume.java` (record ou classe domaine)
Représente une ligne agrégée de dépense du jour :
- `UUID motifId` : ID du motif de sortie
- `String libelleMotif` : Libellé de la dépense (ex: *"Fournitures de bureau & craie"*, *"Transport & déplacement"*)
- `BigDecimal montant` : Montant total décaissé pour ce motif
- `int nombreOperations` : Nombre d'opérations de décaissement

#### `EffectifFormationResume.java` (record ou classe domaine)
Représente la répartition des effectifs par filière :
- `UUID formationId` : ID de la formation
- `String formationNom` : Nom officiel de la filière
- `long nouveauxElevesJour` : Nombre de nouveaux inscrits le jour du bilan
- `long effectifTotal` : Nombre total d'élèves inscrits dans cette formation à date

#### `BilanCentreResume.java`
Résumé opérationnel complet d'un centre pour le Directeur :
- `UUID centreId`, `String centreNom`, `String centreVille`
- `StatutBilan statut` (`OUVERT`, `SOUMIS_CAISSIER`, `VISE_CHEF_CENTRE`, `CLOTURE`)
- `BigDecimal totalEntrees`, `BigDecimal totalSorties`, `BigDecimal netAVerser`
- `int effectifNouveauxElevesTotal`, `int effectifTotalCentre`
- `int nombreSalles`, `int nombreCours`
- `String nomCaissier`, `LocalDateTime dateVisaCaissier`
- `String nomChefCentre`, `LocalDateTime dateValidationChefCentre`
- `String nomControleur`, `LocalDateTime dateValidationControleur`
- `List<LigneEntreeResume> entreesDetaillees` : ventilation entrées par formation et autres recettes
- `List<LigneSortieResume> sortiesDetaillees` : ventilation sorties par motif
- `List<EffectifFormationResume> effectifsParFormation` : effectifs par formation du centre

#### `BilanConsolideNational.java`
Agrégation nationale pour l'ensemble du réseau :
- `LocalDate date`
- `UUID sessionId`
- `BigDecimal totalEntreesNational`
- `BigDecimal totalSortiesNational`
- `BigDecimal netAVerserNational`
- `long totalNouveauxElevesNational`
- `long totalEffectifNational`
- `int centresCloturesCount`
- `int centresTotalCount`
- `List<BilanCentreResume> centres` : liste complète des centres détaillés
- `List<LigneEntreeResume> entreesNationalesDetaillees` : recettes cumulées du réseau ventilées par formation / livres
- `List<LigneSortieResume> sortiesNationalesDetaillees` : dépenses cumulées du réseau ventilées par motif
- `List<EffectifFormationResume> effectifsNationauxParFormation` : effectifs cumulés du réseau par formation

---

### 2.2 Ports & Services applicatifs

#### Port d'entrée (`backend/src/main/java/com/excelisprepas/backend/financier/domain/port/in/ConsulterBilanConsolideDuJourUseCase.java`)
```java
package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.BilanConsolideNational;
import java.time.LocalDate;
import java.util.UUID;

public interface ConsulterBilanConsolideDuJourUseCase {
    BilanConsolideNational consulterBilanConsolide(UUID sessionId, LocalDate date);
}
```

#### Ports sortants de persistance requis
- `ApprenantRepositoryPort` :
  - `long countByCentreIdAndSessionId(UUID centreId, UUID sessionId);`
  - `long countByCentreIdAndSessionIdAndDateInscription(UUID centreId, UUID sessionId, LocalDate dateInscription);`
  - `List<Apprenant> findByCentreIdAndSessionId(UUID centreId, UUID sessionId);` (ou méthode de projection pour le groupage par `formationId`).
- `FormationRepositoryPort` :
  - `List<Formation> findAll();` pour associer les noms des formations.
- `MotifRepositoryPort` / `MotifService` (ou port existant) :
  - Résolution des noms de motifs de dépenses et de recettes (ex: livres).
- `EntreeRepositoryPort` & `SortieRepositoryPort` :
  - Utilisation des méthodes existantes `findByCentreIdAndSessionIdAndDateAndStatut(...)`.

#### Implémentation dans `BilanJournalierService.java`
1. Vérification de la session via `verifierSessionUtilisable(sessionId)`.
2. Récupération de tous les centres via `centreRepository.findAll()` et des formations via `formationRepository.findAll()`.
3. Pour chaque centre :
   - Calcul des totaux et visas via `consulterBilanDuJour(...)`.
   - Récupération des entrées du jour (`VALIDE` et `EN_ATTENTE`) :
     - Entrées associées à une `formationId` : regroupées sous catégorie `"FORMATION"` avec nom de la formation.
     - Entrées sans `formationId` ou associées au motif Livre / Concours : regroupées sous catégorie `"AUTRE"` avec nom du motif (ex: *"Vente de Livres"*).
   - Récupération des sorties du jour (`VALIDE` et `EN_ATTENTE`) :
     - Regroupement par `motifId` avec cumul des montants et comptage d'opérations.
   - Calcul des effectifs par formation pour ce centre :
     - Nombre d'inscrits du jour par formation (date = `date`).
     - Nombre total d'inscrits par formation pour la session.
   - Construction de l'objet `BilanCentreResume`.
4. Agrégation des totaux nationaux :
   - Somme des entrées, sorties, solde net.
   - Consolidation nationale des lignes d'entrées (`entreesNationalesDetaillees`).
   - Consolidation nationale des lignes de sorties (`sortiesNationalesDetaillees`).
   - Consolidation nationale des effectifs par filière (`effectifsNationauxParFormation`).
   - Ratio de centres clôturés (`centresCloturesCount / centresTotalCount`).
5. Retourne `BilanConsolideNational`.

---

### 2.3 Contrôleur REST & DTOs Web

Fichiers dans `backend/src/main/java/com/excelisprepas/backend/financier/infrastructure/in/web/` :
- `dto/LigneEntreeResumeResponse.java` (record)
- `dto/LigneSortieResumeResponse.java` (record)
- `dto/EffectifFormationResumeResponse.java` (record)
- `dto/BilanCentreResumeResponse.java` (record)
- `dto/BilanConsolideResponse.java` (record)
- Endpoint dans `BilanJournalierController.java` :
  - `GET /api/bilans-journaliers/consolide-du-jour`
  - `@RequestParam UUID sessionId`, `@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date`
  - Sécurité : `@PreAuthorize("hasAuthority('FINANCIER_CONSULTER')")`

---

## 3. Architecture Frontend Next.js / TypeScript

### 3.1 Contrats TypeScript & Client API
- **Types (`frontend/src/modules/financier/domain/types.ts`)** :
  ```typescript
  export interface LigneEntreeResume {
    categorie: "FORMATION" | "AUTRE";
    formationId?: string | null;
    libelle: string;
    montant: number;
    nombreOperations: number;
  }

  export interface LigneSortieResume {
    motifId: string;
    libelleMotif: string;
    montant: number;
    nombreOperations: number;
  }

  export interface EffectifFormationResume {
    formationId: string;
    formationNom: string;
    nouveauxElevesJour: number;
    effectifTotal: number;
  }

  export interface BilanCentreResume {
    centreId: string;
    centreNom: string;
    centreVille?: string | null;
    statut: StatutBilan;
    totalEntrees: number;
    totalSorties: number;
    netAVerser: number;
    effectifNouveauxElevesTotal: number;
    effectifTotalCentre: number;
    nombreSalles: number;
    nombreCours: number;
    nomCaissier?: string | null;
    dateVisaCaissier?: string | null;
    nomChefCentre?: string | null;
    dateValidationChefCentre?: string | null;
    nomControleur?: string | null;
    dateValidationControleur?: string | null;
    entreesDetaillees: LigneEntreeResume[];
    sortiesDetaillees: LigneSortieResume[];
    effectifsParFormation: EffectifFormationResume[];
  }

  export interface BilanConsolideNational {
    date: string;
    sessionId: string;
    totalEntreesNational: number;
    totalSortiesNational: number;
    netAVerserNational: number;
    totalNouveauxElevesNational: number;
    totalEffectifNational: number;
    centresCloturesCount: number;
    centresTotalCount: number;
    centres: BilanCentreResume[];
    entreesNationalesDetaillees: LigneEntreeResume[];
    sortiesNationalesDetaillees: LigneSortieResume[];
    effectifsNationauxParFormation: EffectifFormationResume[];
  }
  ```
- **Client HTTP (`frontend/src/modules/financier/data/client.ts`)** :
  - `getBilanConsolideDuJour(sessionId: string, date: string): Promise<BilanConsolideNational>`
- **React Query Hook (`frontend/src/modules/financier/data/queries.ts`)** :
  - `useBilanConsolideDuJour(sessionId: string | undefined, date: string)`

---

### 3.2 Composants & Expérience Utilisateur

#### 1. Page Principale (`frontend/src/app/(dashboard)/bilan-journalier/BilanJournalierView.tsx`)
- Détection du rôle de l'utilisateur :
  - Pour `CHEF_CENTRE` et rôles locaux : la vue unitaire existante est affichée directement, sans tabs.
  - Pour `DIRECTEUR` et `COMPTABLE` : affichage des onglets de navigation :
    - **Onglet 1 : « Synthèse nationale »** *(actif par défaut)*
    - **Onglet 2 : « Détail par centre »** *(vue opérationnelle du centre avec sélecteur)*
- Sélecteur de date unifié en haut de page commun aux deux onglets.

#### 2. Vue Synthèse Nationale (`SyntheseNationaleView.tsx`)
- **4 Cartes KPIs Consolidées** :
  1. *Recettes Nationales* (Entrées totales réseau)
  2. *Dépenses Nationales* (Sorties totales ordonnancées)
  3. *Solde Net en Caisse* (Net cumulé à verser)
  4. *Clôtures & Effectifs Réseau* (Ratio ex: `3 / 3 centres clôturés`, effectif total et nouveaux inscrits)
- **Tableau Interactif Multi-Centres avec Volet Accordéon** :
  - Pour chaque centre :
    - Ligne principale : Centre, Ville, Statut (badge coloré), Total Entrées, Total Sorties, Net à verser, Activité (Salles / Cours), Signataire, Bouton *"Consulter"* (bascule vers le détail).
    - **Volet Dépliable au clic sur la ligne** présentant les 3 sous-tableaux détaillés :
      - 🟢 **Entrées du centre** : ventilation par formation (Polytechnique, Médecine, etc.) et postes annexes (Vente livres, frais dossiers).
      - 🔴 **Sorties du centre** : ventilation détaillée par motif de dépense (transport, fournitures, entretien, etc.).
      - 👥 **Effectifs par formation** : Nouveaux élèves du jour / Effectif total inscrit dans chaque filière.
- **Section Récapitulative Nationale Consolidée** :
  - Synthèse globale réseau reprenant les totaux ventilés par filière, par livres et par postes de dépenses.

#### 3. Fiche d'Impression Officielle A4 Nationale (`FicheSyntheseNationalePrintModal.tsx`)
Gabarit A4 officiel conforme aux exigences physiques d'EXCELIS :
- En-tête officiel EXCELIS PREPAS, logo, devise et référence `NAT/JJ/MM/AAAA`.
- **Tableau 1 : Récapitulatif National des Caisses par Centre** (Entrées, Sorties, Net, Statut, Signataire).
- **Tableau 2 : Ventilation Nationale des Entrées (Formations, Livres & Autres)** (libellé, effectif payeur, montant XAF, pourcentage).
- **Tableau 3 : Ventilation Nationale des Sorties par Motif** (libellé du poste, montant XAF, part des dépenses).
- **Tableau 4 : Synthèse des Effectifs par Filière** (Nouveaux élèves du jour / Effectif global réseau).
- Totaux généraux en chiffres et montant net arrêté en toutes lettres via `nombreEnLettres(netNational)`.
- Encart bancaire UBA Cameroun & double cadre de visa (*Visa Contrôle / Comptabilité Générale* et *Visa Direction Générale*).

---

## 4. Sécurité & Contrôle d'Accès

| Rôle | Accès Synthèse Nationale | Détail par centre (tous) | Saisie Mouvements | Visa Chef de Centre | Clôture Comptable |
|---|:---:|:---:|:---:|:---:|:---:|
| `DIRECTEUR` | **Oui** | **Oui** | Non | Oui (supervision) | Oui (supervision) |
| `COMPTABLE` | **Oui** | **Oui** | Non | Non | **Oui (définitif)** |
| `CHEF_CENTRE` | Non | **Oui (son centre)** | Oui | **Oui** | Non |
| `CAISSIER` | Non | **Oui (son centre)** | **Oui** | Non | Non |

---

## 5. Plan de Vérification & Tests

### 5.1 Tests Backend
- **Test unitaire de service (`BilanJournalierServiceTest.java`)** :
  - Test de `consulterBilanConsolide` avec 2 ou 3 centres.
  - Vérifier que les entrées sont correctement ventilées par formation et par livres.
  - Vérifier que les sorties sont correctement ventilées par motif de dépense.
  - Vérifier que les effectifs (nouveaux et total) sont correctement ventilés par formation pour chaque centre et au global.
  - Vérifier le calcul exact des sommes et du ratio de centres clôturés.
- **Test d'intégration Web (`BilanJournalierControllerTest.java`)** :
  - Vérifier `GET /api/bilans-journaliers/consolide-du-jour` avec autorisation.
  - Commande : `./mvnw test -Dtest=BilanJournalier*Test`.

### 5.2 Tests Frontend
- Vérification stricte TypeScript : `pnpm typecheck`
- Linter : `pnpm lint`

### 5.3 Validation Manuelle Visuelle
- Se connecter en tant que Directeur : observer les onglets « Synthèse nationale » et « Détail par centre ».
- Vérifier le bon calcul des KPIs consolidés.
- Déplier la ligne d'un centre pour observer le détail des entrées (formations, livres), des sorties (motifs) et des effectifs par filière.
- Cliquer sur le bouton « Consulter » d'un centre : vérifier la bascule immédiate sur l'onglet « Détail par centre » avec ce centre activé.
- Cliquer sur « Imprimer la synthèse nationale » : vérifier l'exactitude de la fiche A4 (tableaux de ventilation, montant en lettres, zones de visa).
