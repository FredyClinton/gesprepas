# Suivi des Tâches et Avancements (Frontend & Backend)

Ce document trace l'évolution des travaux, les fonctionnalités implémentées, et les correctifs appliqués de manière transverse (Frontend et Backend) sur le projet Gesprepas.

## 📌 Tâches Réalisées

### 1. Refonte de la Page de Connexion (Frontend)
- **Design & UX** : Centrage de la carte de connexion sur un fond gris clair très professionnel (style SaaS). Augmentation de la taille des champs de saisie pour un meilleur confort.
- **Interactions** : Ajout d'un effet de "Lift" (élévation douce et ombre portée agrandie) au survol de la carte de connexion (`hover:-translate-y-1.5`).
- **Correction Tailwind v4** : Séparation de la directive `@theme inline` (pour les polices) et `@theme` (pour les couleurs) dans `globals.css`. Cela a permis de réparer le système de couleurs globales (le texte et les fonds n'appliquaient pas les couleurs de la charte).

### 2. Tableau de Bord : Directeur Académique (Frontend)
- **Design des KPIs** : Rendu des 4 cartes d'indicateurs plus "vivantes".
  - Ajout d'animations fluides au survol (la carte remonte de 1px, l'ombre s'intensifie, l'icône grossit de 10%).
  - Intégration de dégradés légers et colorés derrière les icônes.
  - Ajout d'un halo rouge lumineux en arrière-plan sur la carte "Créneaux sans prof" lorsqu'une alerte est active (nombre > 0).
  - Suppression des bordures supérieures trop épaisses pour garder un design épuré.
  - **Correction de la visibilité des textes d'aide sous les cartes** : suppression des opacités trop élevées (`text-brand-gray/60` et `/70`) qui les rendaient presque invisibles sur fond clair.
- **Logique** : Ajout du calcul du "Nombre de cours" basés sur la liste des `affectations` de la semaine en cours au lieu d'un placeholder vide.

### 3. Résolution de Bugs et Base de Données (Backend)
- **Bug "Enseignants Actifs"** : La carte KPI des enseignants n'affichait rien. L'appel à l'API `GET /api/enseignants` renvoyait une erreur 500.
- **Analyse** : Spring Boot/Hibernate cherchait à lire une colonne `date_recrutement` dans la table PostgreSQL `enseignants`, mais elle n'existait pas. Flyway étant désactivé, l'entité Java était désynchronisée de la BDD.
- **Correction** : 
  - Injection manuelle en base de données : `ALTER TABLE enseignants ADD COLUMN date_recrutement DATE DEFAULT CURRENT_DATE NOT NULL;`.
  - Création du script de migration officiel pour l'historique : `backend/src/main/resources/db/migration/V8__ajout_date_recrutement_enseignants.sql`.

### 4. Page de Gestion des Enseignants (`/enseignants`)
- **Diagnostic du tableau vide** :
  - La cause racine était l'erreur 500 sur `/api/enseignants` (corrigée avec l'ajout de `date_recrutement`).
  - Dans le composant `EnseignantsListView.tsx`, l'état `isError` de React Query n'était pas intercepté : lorsque l'API échouait, `chargement` passait à `false`, `enseignants` restait `undefined`, et le corps du tableau (`<tbody>`) restait totalement vide sans afficher d'alerte ni de message d'erreur.
- **Correction & Résilience** :
  - Prise en compte de `isError` avec affichage d'un message d'erreur convivial et d'un bouton d'action "Réessayer" (`refetch`).
- **Formulaire de création d'enseignant en Pop-up (Modal) & alignement Backend** :
  - Création d'un composant générique et réutilisable `Modal.tsx` (`shared/ui`) avec flou d'arrière-plan, gestion de la touche Échap et fermeture au clic extérieur.
  - Remplacement de la carte dépliable par cette Modal élégante et aérée.
  - Alignement exhaustif des champs avec le DTO backend `CreerEnseignantRequest` :
    - *Identité & Rémunération* : Nom, Prénom, Matricule, Coût par séance.
    - *Coordonnées & Identification* : Téléphone, Numéro CNI.
    - *Profil Académique* : École/Fonction, Niveau/Grade, Date de recrutement.
    - *Rattachement* : Sélection jusqu'à 2 départements (DA) ou automatique (CDD).
  - Nettoyage des chaînes vides converties en `null` dans l'API client pour une persistance BDD propre.

### 5. Page Détail d'un Enseignant (`/enseignants/[enseignantId]`)
- **Résolution d'un bug Backend sur l'Ancienneté** :
  - L'appel à `GET /api/enseignants/{id}/anciennete` échouait avec une erreur SQL : `column ae1_0.statut_paiement does not exist` sur la table `affectations`.
  - **Correction BDD** : exécution de `ALTER TABLE affectations ADD COLUMN statut_paiement VARCHAR(30) DEFAULT 'NON_PAYEE' NOT NULL;`.
- **Intégration des données réelles du Backend** :
  - Remplacement de tous les placeholders codés en dur (`-`) par les vraies valeurs issues du serveur :
    - Téléphone et Numéro CNI.
    - École / Fonction et Niveau / Grade.
    - Date de recrutement formatée en français.
  - Connexion du hook `useAncienneteEnseignant` pour récupérer et afficher l'ancienneté calculée en direct par le backend (ex: `1a 3m`).
- **Refonte UI/UX complète (Moderne, Lisible & Vivante)** :
  - **Bannière d'identité (Hero Banner)** :
    - Avatar visuel avec initiales stylisées sur un dégradé orange/ambre doux.
    - Pastille d'état dynamique (vert émeraude pour *Actif*, ardoise pour *Suspendu*).
    - Affichage en badge monospace du matricule, et tags rapides pour l'école et le grade.
    - Boutons d'action rapides (Suspendre/Réactiver et Suppression) repositionnés en haut à droite.
  - **Ruban de 4 Cartes KPI Dynamiques** :
    1. *Séances Session* : total des séances programmées sur la session active.
    2. *Séances Effectuées* : nombre de cours donnés, pourcentage d'avancement et barre de progression fluide.
    3. *Cumul Honoraires* : montant total calculé en direct (`séances effectuées × coût par séance`) + rappel du tarif unitaire.
    4. *Ancienneté & Présence* : années/mois calculés par le backend et date précise de recrutement.
  - **Architecture en 2 Colonnes SaaS Équilibrée** :
    - *Colonne gauche* : 3 cartes bien découpées avec icônes explicites (*Coordonnées & CNI*, *Profil Académique & Honoraires*, *Départements rattachés* avec badge chip et sélecteur interactif).
    - *Colonne droite* : Carte centrale du planning avec recherche en temps réel, filtres par matière et par statut, et tableau épuré (remplacement de l'entête noir brut par un entête SaaS gris doux `bg-slate-50`, survol doux et badges d'état colorés).
  - **Modales Modernes pour les Actions** :
    - Remplacement des formulaires étroits inline par des modales dédiées avec flou d'arrière-plan : modification du nom, modification des honoraires, et dialogue de confirmation de suppression sécurisé.

### 6. Migration de la Base de Données vers la Dernière Version (V8)
- **Sauvegarde Préalable** :
  - Création d'un dump complet de la base PostgreSQL : `backup_excelis_prepas_20260910_120130.sql` (89 Ko) garantissant l'intégrité de toutes les données existantes.
- **Préservation Intégrale des Utilisateurs** :
  - Tous les 20 utilisateurs existants (Jean Mballa, Marie Ngo, Chefs de départements, Chefs de centre, Caissiers, Chargés de dossiers...) ont été conservés avec leurs rôles, centres rattachés, identifiants et mots de passe hachés.
  - La synchronisation des adresses email dans la table `personnel` a été validée pour l'authentification JPA (`/api/auth/login`).
- **Fiabilisation et Alignement des Scripts Flyway (V1 à V8)** :
  - `V1__init_schema.sql` : suppression des doublons générés par l'export Hibernate, idempotence avec `IF NOT EXISTS`.
  - `V2__init_schema.sql` : nettoyage en checkpoint valide.
  - `V3__ajout_departement_id_utilisateurs.sql` : rendu idempotent.
  - `V4__ajout_gel_enseignants.sql` : rendu idempotent.
  - `V5__remuneration_enseignants.sql` : correction des noms de tables cibles (`affectations`, `enseignants`).
  - `V6__refactor_personnel_et_paie.sql` : normalisation de la table `personnel`, migration propre des emails et téléphones, et suppression des colonnes obsolètes (`utilisateurs.email`, `utilisateurs.departement_id`, `personnel.mode_calcul_paie`, `enseignants.telephone`, `enseignants.numero_cni`).
  - `V7__separation_programmation_execution_paie.sql` : ajout sécurisé du statut sur `fiches_paie_enseignant`.
  - `V8__ajout_date_recrutement_enseignants.sql` : ajout officiel de `date_recrutement` sur `enseignants`.
- **Résolution des Erreurs Bloquantes d'Évolution de Schéma** :
  - Création des phases par défaut (`PHASE_1` - Classique, `PHASE_2` - Intensive) dans la table `phases`.
  - Ajout et population des clés étrangères `phase_id` et `formation_id` sur les tables `salles`, `progressions` et `concours` qui bloquaient lors de la mise à jour Hibernate avec contrainte `NOT NULL`.
### 7. Modernisation Visuelle Globale des Tableaux (En-têtes Lumineux & Survol Vivant)
- **Suppression du Noir Agressif sur les En-têtes (`bg-brand-anthracite`)** :
  - Remplacement généralisé du fond noir sombre par un design clair, vif et moderne : `bg-slate-100/90 border-b border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider`.
  - Pour les tableaux avec défilement interne (comme la liste des enseignants), l'en-tête reste ancré avec effet de translucidité subtile (`sticky top-0 z-10 backdrop-blur-xs`).
  - Pour la grille de planification (`PlanificationView`), remplacement du noir brut par un gris ardoise élégant `bg-slate-700` / `bg-slate-600` en harmonie avec les formations `bg-brand-orange`.
- **Mise en Évidence Immédiate au Survol (`hover:bg-amber-50/70`)** :
  - Chaque ligne de tableau (`<tr>`) s'anime désormais avec une mise en surbrillance ambrée lumineuse (`hover:bg-amber-50/70 transition-colors duration-150`) qui reprend la palette chaleureuse d'Excelis Prepas sans éblouir.
  - Séparation nette et aérée des lignes via `border-b border-slate-100 last:border-0` ou `divide-y divide-slate-100`.
- **Périmètre des 10 Fichiers Mis à Jour** :
  1. `EnseignantsListView.tsx` : En-tête sticky ardoise claire, survol chaud ambré sur chaque enseignant.
  2. `EnseignantDetailView.tsx` : Tableau des séances harmonisé avec `bg-slate-100/90` et survol `hover:bg-amber-50/70`.
  3. `chef-centre.tsx` : Tableau des KPIs du centre avec en-tête moderne et survol interactif.
  4. `chef-departement.tsx` : Tableau des créneaux en attente d'assignation rendu lumineux et dynamique au survol.
  5. `directeur.tsx` : Tableau des KPIs par centre du Directeur Académique rafraîchi et lisible.
  6. `ApprenantsListView.tsx` : En-tête modernisé et composant `LigneApprenant` doté du survol ambré.
  7. `ContratEtPaiementsTab.tsx` : Historique des versements financier avec en-tête slate doux et survol.
  8. `PresenceTab.tsx` : Tableau d'émargement et présences/justifications rafraîchi avec survol.
  9. `CentreDetailView.tsx` : Historique des adresses du centre avec en-tête slate lumineux et survol fluide.
  10. `PlanificationView.tsx` : Grille hebdomadaire débarrassée de l'anthracite brut et lignes horaires mises en valeur au survol souris.

---

### 8. Refonte Complète de la Liste des Enseignants (Moderne, Lisible et Vivante)
- **Ruban de 4 Cartes KPI Synthétiques** :
  1. *Total Enseignants* : Effectif global du corps professoral avec icône `Users` sur fond orange doux.
  2. *Actifs en Session* : Nombre d'enseignants actifs, pourcentage de disponibilité et indicateur vert pulsant.
  3. *Enseignants Suspendus* : Nombre d'enseignants suspendus ou inactifs avec badge ambré.
  4. *Coût Moyen / Séance* : Tarif unitaire moyen en direct calculé sur le corps professoral affiché.
- **Barre de Sélection des Départements Raffinée** :
  - Accompagnée de l'icône `Building2`, présente des boutons pills arrondis avec le total global et les compteurs d'enseignants par département.
- **Barre d'Outils et Filtres Intelligente** :
  - Champ de recherche textuelle avec bouton de suppression rapide (`X`).
  - Menu déroulant de filtre par statut avec icône `Filter`.
  - Bouton de réinitialisation dynamique en 1 clic dès qu'un filtre ou une recherche est actif.
  - Compteur d'enseignants correspondants en temps réel.
- **Tableau Haut de Gamme & Vivant** :
  - *Avatars personnalisés* : Chaque enseignant dispose d'un avatar circulaire avec ses initiales et une palette de couleurs générée de manière déterministe.
  - *Identité & Rôle* : Nom et prénom en gras s'animant en orange au survol, complété par l'école/fonction académique, grade ou téléphone.
  - *Pill Matricule* : Rendu sous forme de puce monospace avec bordure subtile (`font-mono`).
  - *Chips Départements* : Badges orange doux arrondis (`bg-orange-50 text-brand-orange border border-orange-200/70`) à la place du simple texte brut séparé par des virgules.
  - *Rémunération claire* : Affichage propre en FCFA avec rappel `/ séance`.
  - *Statut vivant* : Badge `Actif` avec pastille verte pulsante (`animate-pulse`) ou badge `Suspendu` ardoise.
  - *Boutons d'action modernes* : Puces d'actions dédiées avec survols colorés (`Voir` en orange, `Modifier` en bleu, `Suspendre/Réactiver` en rose/émeraude).
- **États Vides et de Chargement Soignés** :
  - *Squelette de chargement* : 5 lignes animées (`animate-pulse`) avec avatars et silhouettes de badges pendant la récupération des données.
  - *État vide illustré* : Icône de recherche centrée, message convivial et bouton direct pour réinitialiser les filtres.

### 9. Hiérarchisation UX des Actions (Rétrogradation des Actions Rares & Destructives)
- **Principe UX appliqué** :
  - Les actions fréquentes (consultation, édition) sont accessibles directement ou en un clic.
  - Les actions rares, sensibles ou irréversibles (suspension, suppression) ne doivent jamais être au premier plan visuel ni prêtes au clic accidentel.
- **Liste des Enseignants (`EnseignantsListView.tsx`)** :
  - Retrait des boutons d'actions rares (`Ban` / `RotateCcw`) qui encombraient la ligne du tableau.
  - Bouton direct épuré pour l'action principale : `Voir le profil` (`Eye`).
  - Menu contextuel discret `...` (`MoreVertical`) pour les gestionnaires :
    - *Modifier les informations* (`Pencil`)
    - Séparateur de sécurité visuel
    - *Suspendre l'enseignant* (ou *Réactiver l'enseignant*)
- **Fiche Détail Enseignant (`EnseignantDetailView.tsx`)** :
  - Retrait des boutons agressifs "Suspendre" et "Supprimer" qui dominaient l'en-tête (hero banner).
  - Bouton d'action principal valorisé : `Modifier le profil` (`Pencil`).
  - Menu d'options secondaires `...` (`MoreVertical`) regroupant en toute discrétion et sécurité :
    - *Suspendre / Réactiver l'enseignant*
    - *Supprimer définitivement* (avec confirmation modale sécurisée)

### 10. Statut de Paiement des Séances & Historique des Fiches de Paie Enseignant
- **Contexte & Objectif (Pourquoi)** :
  - Permettre à la direction et aux gestionnaires de suivre avec précision la rémunération de chaque enseignant : savoir pour chaque séance planifiée ou effectuée si elle a été réglée, si elle est programmée dans un bordereau de décompte, ou si elle est en attente de paiement.
  - Donner une visibilité exhaustive sur l'historique de ses fiches de paie individuelles issues des bordereaux avec leur date d'effet, volume de séances et montant net versé.
- **Modifications Backend (Quoi & Où)** :
  - `AffectationResponse.java` :
    - Exposition des champs `statutPaiement` (`NON_PAYEE`, `PROGRAMMEE`, `PAYEE`), `coutApplique` (montant effectif de la séance) et `fichePaieId`.
    - Préservation d'un constructeur surchargé rétrocompatible pour ne casser aucun appel existant.
  - `AffectationController.java` :
    - Mise à jour du mapper `versReponse` pour transmettre les attributs de paiement réels de chaque affectation.
  - `FichePaieEnseignantJpaRepository.java` (Nouveau) :
    - Repository Spring Data JPA avec requêtes optimisées `JOIN FETCH` par enseignant et session, ordonnées par date de paiement descendante.
  - `FichePaieEnseignantItemResponse.java` (Nouveau) :
    - DTO de transport pour les fiches de paie individuelles (id, référence bordereau, date de paiement, montant total, nombre de séances, statut `PROGRAMMEE` / `PAYEE`).
  - `RemunerationController.java` :
    - Ajout du endpoint REST `GET /api/remuneration/enseignants/{enseignantId}/fiches` avec filtrage optionnel par session (`sessionId`).
- **Modifications Frontend (Quoi & Où)** :
  - `src/modules/affectation/domain/types.ts` & `index.ts` :
    - Définition de `StatutPaiementAffectation` (`"NON_PAYEE" | "PROGRAMMEE" | "PAYEE"`), des labels `LABELS_STATUT_PAIEMENT` et enrichissement de l'interface `Affectation`.
  - `src/modules/remuneration/` (Nouveau module) :
    - Types (`FichePaieEnseignant`, `StatutFichePaie`), client API (`listFichesPaieEnseignant`) et hook React Query (`useFichesPaieEnseignant`).
  - `EnseignantDetailView.tsx` :
    - **KPIs d'en-tête** : Décomposition dynamique du cumul des honoraires affichant en direct le montant déjà payé (en vert) et le montant en cours / en attente (en ambré).
    - **Système d'Onglets Moderne** :
      - *Onglet 1 : Planning des Séances* (avec compteur de séances).
      - *Onglet 2 : Historique & Fiches de paie* (avec compteur de fiches émises).
    - **Tableau des Séances Enrichi** :
      - Nouvelle colonne dédiée **Paiement** affichant le badge de statut de paiement (`Payée`, `Programmée`, `En attente`, `À venir`, `Non due`) et le montant exact en FCFA.
    - **Barre de Recherche & Filtres Ultra-Lisibles** :
      - Remplacement de la grille étriquée à 4 colonnes par un panneau blanc surélevé (`bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs`).
      - Champ de recherche agrandi (`h-10`) avec loupe orange dynamique (`text-brand-orange`), bouton d'effacement rapide (`X`) et bouton de réinitialisation instantané des filtres (`RotateCcw`).
      - 3 filtres déroulants (`Matière`, `Statut Séance`, `Statut Paiement`) organisés avec de vrais libellés d'en-têtes et icônes indicatives (`Layers`, `CheckCircle2`, `Coins`), bordures contrastées et typographie lisible (`text-xs font-semibold text-slate-800`).
    - **Vue Historique des Paiements & Fiches** :
      - 4 mini-cartes de synthèse financière : Total honoraires acquis, Déjà réglé, Programmées en bordereau, En attente de décompte.
      - Alerte informative lorsque des séances effectuées sont prêtes pour le prochain bordereau.
      - Tableau des fiches de paie avec référence bordereau, date, volume de séances, montant net, statut et bouton d'inspection.
      - *Modal interactif de détail de fiche de paie* : affiche la ventilation complète de la fiche et liste toutes les séances qui y sont rattachées.

### 11. Fiche Détaillée du Personnel & Détection Double Statut Enseignant
- **Contexte & Objectif** :
  - Permettre de naviguer directement depuis la liste du personnel d'un centre (`CentreDetailView`) vers une fiche détaillée dédiée (`/personnel/[personnelId]`) conçue selon les mêmes standards d'excellence visuelle et fonctionnelle que la fiche enseignant.
  - Détecter automatiquement si un membre du personnel administratif (Chef de centre, Caissier, Chargé de dossier...) est également enseignant dans l'établissement, et afficher ses données pédagogiques (matricule, départements, cours, assiduité, honoraires).
  - Contrôle d'accès granulaire et confidentiel selon le profil de l'utilisateur connecté (Ownership & RBAC) :
    - *Directeur & Comptable* : vue exhaustive (infos administratives, finances, salaire de référence, fiches de paie).
    - *Directeur Académique* : infos administratives + profil enseignant et planning des cours complet (les finances et salaires de base du personnel sont masqués).
    - *L'utilisateur lui-même* : accès complet à toutes ses propres données (finances personnelles, fiches de paie et cours).
    - *Autres rôles (ex: Chef de centre)* : consultation limitée à l'identité, centre, rôle et coordonnées professionnelles.
- **Modifications Backend** :
  - `EnseignantResponse.java` : exposition du champ `email` hérité de `Personnel` avec constructeur rétrocompatible.
  - `EnseignantController.java` : transmission de l'email dans `versReponse`.
  - `PersonnelController.java` & `PersonnelService.java` : ajout du endpoint REST `GET /api/personnel/{id}` et de `RecupererPersonnelUseCase`.
  - `PersonnelExceptionHandler.java` : prise en compte de `PersonnelIntrouvableException` avec réponse HTTP 404.
  - `PersonnelControllerTest.java` : tests unitaires automatisés validant la récupération 200 et 404.
- **Modifications Frontend** :
  - `CentreDetailView.tsx` :
    - Chaque ligne de personnel dans l'onglet *Personnel* devient un lien interactif cliquable vers sa fiche (`/personnel/${u.id}`) avec survol ambré doux (`hover:bg-amber-50/60 cursor-pointer`).
    - Badge distinctif `Enseignant` avec icône `GraduationCap` affiché directement sur la ligne si le collaborateur est enseignant.
    - Flèche de navigation `ChevronRight` avec micro-animation au survol.
  - `src/modules/personnel` & `src/modules/utilisateurs` :
    - Définition des types `PersonnelMembre`, `HistoriqueSalairePersonnel` et enrichissement d'`Utilisateur` (`telephone`, `numeroCni`) et `Enseignant` (`email`).
    - Ajout des hooks et clients `usePersonnel(id)`, `useUtilisateur(id)`, `useHistoriqueSalairePersonnel(personnelId, sessionId)` et `useDefinirSalairePersonnel()`.
  - `PersonnelDetailView.tsx` (Nouveau composant) :
    - Hero banner avec grand avatar déterministe, rôle, centre rattaché et badge `Également Enseignant`.
    - Ruban de 4 KPIs dynamiques adaptés aux droits de l'utilisateur (Affectation, Salaire de référence ou statut, Séances cours ou session, Honoraires cours ou accréditations).
    - Architecture en 2 colonnes SaaS équilibrée :
      - *Colonne gauche* : Coordonnées professionnelles, rôle & centre, rémunération administrative (si autorisé), profil enseignant (si applicable).
      - *Colonne droite* : Si enseignant, onglets *Planning des séances* (filtres, recherche, statut séance, statut paiement) et *Fiches de paie*; si non enseignant, panneau stylisé des missions opérationnelles.
  - Routes Next.js :
    - `src/app/(dashboard)/personnel/[personnelId]/page.tsx` : page serveur sécurisée avec vérification de session et contrôle d'accès.
    - `src/app/(dashboard)/personnels/[personnelId]/page.tsx` : redirection transparente évitant toute erreur 404 sur les URLs au pluriel.

---

## 🚀 Prochaines Étapes
- Format et stratégie de génération automatique du matricule enseignant par le backend.
- Mettre en place le graphique "Progression Pédagogique par Formation" sur le dashboard Directeur Académique.






