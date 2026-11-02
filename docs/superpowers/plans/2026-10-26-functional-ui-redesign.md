# Plan de Reconception Fonctionnelle des Interfaces — EXCELIS PRÉPAS

> **Pour le travailleur agentique :** Exécution directe et native dans le code existant, page par page. Préservation impérative des contrats d'API, routes, règles métier, rôles et permissions.

**Objectif :** Réorganiser l'ergonomie, la hiérarchie de l'information et les flux d'actions métier de l'application EXCELIS PRÉPAS pour passer d'une accumulation d'éléments graphiques/badges à des interfaces professionnelles, denses et centrées sur l'efficacité des utilisateurs.

**Architecture & Stack :** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, TanStack Query.

---

## 1. Principes de Design & Ergonomie Fonctionnelle

1. **Hiérarchie Claire & En-tête Compact :**
   - Hauteur contenue, un seul titre clair avec sous-titre contextuel succinct (ex: session ou centre actif).
   - Bouton d'action primaire en haut à droite (ou bien placé dans le flux).
   - Pas de répétition d'indicateurs déjà présents sous forme de KPI ou de filtres.

2. **Présentation de l'Information Adaptée au Travail Métier :**
   - Remplacer les cartes empilées ou accordéons lourds par des tableaux denses, lisibles et alignés lorsque l'utilisateur a besoin de comparer, vérifier ou saisir.
   - Regrouper logiquement les éléments (ex: par filière, par date, par statut) avec en-têtes de section sobres.
   - Réduire le bruit visuel : éliminer les icônes répétées sur chaque ligne si elles n'apportent aucun sens (ex: icône de livre répétée 30 fois).

3. **Stepper et Workflow Transparent :**
   - Présenter le cycle de vie réel (ex: Épreuves -> Saisie -> Compilation -> Résultats).
   - Mettre en évidence l'étape courante et la **prochaine action requise** (Next Action Banner/Indicator).
   - Ne pas faire passer des badges passifs pour des boutons ou des étapes interactives trompeuses.

4. **Préservation Fonctionnelle Totale :**
   - Conserver tous les formulaires, modales, mutations TanStack Query, paramètres d'URL, droits d'accès (DA, Chef Centre, Chef Département, Caissier), exports PDF/Excel, et états de chargement/erreur.

---

## Tâches par Écran

### Tâche 1 : Concours Blancs & Évaluations (`ConcoursBlancsView.tsx`)
- En-tête : Réduire la hauteur, retirer les badges redondants, garder Titre + Session/Centre + Bouton Nouveau Concours.
- Sélecteur de Concours : Barre de sélection sobre et directe (pills ou onglets compacts) avec n° concours, date, et statut discret sans surcharge de badges.
- Progression & Prochaine Action : Cockpit condensé avec stepper de cycle de vie et bandeau contextuel clair sur la prochaine action métier.
- Matières & Épreuves : Tableau structuré et compact par filière (Filière / Matière / Durée / Coef / Barème / Statut sujet / Action). Suppression des icônes décoratives inutiles, alignement tabulaire des valeurs numériques (tabular-nums).

### Tâche 2 : Sessions & Calendrier des Phases (`SessionsPhasesView.tsx`)
- En-tête épuré et sélecteur de session sobre.
- Synthèse chronologique du calendrier des phases sans encombrement de cartes disproportionnées.
- Table compacte des phases avec statut, dates, actions de clôture/réouverture.

### Tâche 3 : Centres & Départements (`CentresListView.tsx` & `DepartementsListView.tsx`)
- Centres : Tableau condensé avec statistiques directes (Effectif, Formations actives, Responsable, Ville, Statut), actions d'édition/détail alignées.
- Départements : Tableau clair des départements avec Matière de rattachement, Chef de département assigné, nombre d'enseignants, sans badges superflus.

### Tâche 4 : Personnel & Enseignants (`PersonnelListView.tsx` & `EnseignantsListView.tsx`)
- Liste du personnel : Vue tabulaire dense avec recherche rapide, filtre par rôle, statut contrat, informations de contact et accès rapide aux fiches.
- Enseignants : Vue épurée avec discipline/matière, volumes horaires et statut d'affectation.

### Tâche 5 : Dossiers d'Inscription (`DossiersView.tsx`)
- Restructuration du filtrage et de la table des dossiers : Statut administratif, complétude des pièces, scolarité, paiement.
- Actions directes de validation et consultation des pièces.

### Tâche 6 : Finances & Bilan Journalier (`FinancesCaissierView.tsx` & `BilanJournalierView.tsx`)
- Caissier : Vue de caisse optimisée pour l'encaissement rapide, tableau des versements du jour, solde de caisse visible sans distraction.
- Bilan Journalier : Découpage clair entre ventilation des recettes/dépenses, clôture journalière et validation de la direction.

### Tâche 7 : Livres & Supports (`LivresView.tsx`) & Paie (`PaieView.tsx`)
- Livres : Catalogue & mouvements de stocks présentés sous forme de table d'inventaire précise avec alertes de seuil discrètes.
- Paie : Grille de calcul des rémunérations, bordereaux de vacations, export et validation des paiements.

### Tâche 8 : Tableaux de Bord (`_dashboards/`)
- Alignement du tableau de bord Directeur, Chef de Centre et Directeur Académique sur la sobriété et l'efficacité décisionnelle : métriques clés en haut, alertes opérationnelles immédiates, raccourcis vers les actions en attente.
