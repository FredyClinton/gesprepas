# 📘 GESPREPAS — Briefing du Projet & Guide d'Architecture pour Agents IA

> **Documentation de référence technique et fonctionnelle** destinée aux ingénieurs et agents IA intervenant sur le codebase **GESPREPAS** (Excelis Prépa).

---

## 1. 🌟 Vue d'Ensemble du Projet

**GESPREPAS** est une plateforme intégrée de gestion d'entreprise (ERP / SIS scolaire) conçue pour piloter le réseau des classes préparatoires aux concours d'excellence **Excelis Prépa** (Grandes Écoles d'Ingénieurs, Médecine, Écoles de Commerce, ENS, etc.).

### Objectifs Clés
- **Multi-centres physiques** : Supervision décentralisée par centre d'apprentissage avec consolidation financière et pédagogique au niveau national.
- **Multi-sessions académiques** : Gestion annuelle des sessions avec transition des cursus, cohortes et contrats.
- **Cycle complet de l'apprenant** : De la pré-inscription / admission à la négociation des contrats par phase pédagogique, suivi des paiements, passage des concours blancs et délivrance des relevés.
- **Rigueur financière & comptable** : Traçabilité au centime près des encaissements (scolarité, livres, concours), bilans journaliers vérifiés et clôturés, ordonnancement des dépenses et paie du corps professoral.

---

## 2. 🏛️ Architecture Technique & Stack

Le projet est structuré sous forme de monorepo à deux composantes principales :

```
gesprepas/
├── backend/                  # API REST Spring Boot 3 (Java 21) - Architecture Hexagonale
├── frontend/                 # Application Next.js 16 (App Router, Turbopack, React 19)
├── docs/                     # Spécifications métier et plans calendaires
├── docker-compose.yml        # Services locaux (PostgreSQL, etc.)
└── PROJECT_BRIEFING.md       # Ce guide de référence
```

### ☕ Backend (Clean / Hexagonal Architecture)
- **Langage / Runtime** : Java 21 (OpenJDK 64-Bit).
- **Framework** : Spring Boot 3.x, Spring Data JPA, Spring Security.
- **Base de données** : PostgreSQL avec migrations versionnées **Flyway** (`backend/src/main/resources/db/migration/` - de `V1` à `V21`).
- **Pattern architectural** : **Ports & Adapters (Hexagonal)** :
  - `domain/model/` : Entités pures et value objects, sans dépendance Spring/JPA.
  - `domain/port/in/` : Interfaces des Use Cases exposés aux points d'entrée (ex: `SaisirEntreeUseCase`, `ModifierEntreeUseCase`).
  - `domain/port/out/` : Interfaces des contrats de persistance ou services externes (ex: `EntreeRepositoryPort`, `BilanJournalierRepositoryPort`).
  - `domain/service/` : Services applicatifs implémentant les Use Cases et garantissant les règles métier.
  - `infrastructure/in/web/` : Contrôleurs REST, DTOs (`record`), validation Jakarta (`@Valid`), handlers d'exceptions globaux.
  - `infrastructure/out/persistence/` : Entités JPA (`@Entity`), interfaces Spring Data JPA, adaptateurs implémentant les ports sortants.
  - `infrastructure/config/` : Classes `@Configuration` assemblant les beans de use cases sans annotations Spring dans le domaine.
- **Documentation API** : OpenAPI / Swagger UI disponible sur `/swagger-ui.html`.

### ⚛️ Frontend (Next.js 16 + Clean Modules)
- **Framework** : Next.js 16 (App Router, Turbopack activé).
- **Langage / UI** : TypeScript, React 19, Tailwind CSS v4, Lucide Icons.
- **Gestion du Cache & Réseau** : TanStack Query (React Query) v5 avec invalidation fine des clés (`queryClient.invalidateQueries(...)`).
- **Authentification** : NextAuth avec session JWT contenant les rôles, permissions et le `centreId` rattaché.
- **Architecture modulaire (`src/modules/*`)** : Chaque domaine métier dispose de :
  - `domain/types.ts` : Types TypeScript et contrats de données.
  - `data/client.ts` : Fonctions HTTP pures (basées sur `apiFetch`).
  - `data/queries.ts` : Hooks TanStack Query (`useQuery`, `useMutation`).
  - `components/` : Composants et modales spécifiques à la feature.
  - `index.ts` : Baril d'exportation propre pour le reste de l'application.
- **Composants partagés (`src/shared/ui/`)** : `Card`, `Button`, `Modal`, `Input`, `Pagination`, `ApprenantCombobox`, `Skeleton`, `SkeletonCard`, `SkeletonTable`.

---

## 3. 🧩 Cartographie Fonctionnelle des Modules

### 1. Centres & Sessions Académiques (`session`, `centre`)
- Gestion des sessions universitaires/scolaires avec statuts (`PLANIFIEE`, `EN_COURS`, `CLOTUREE`). Une seule session active à la fois.
- Centres physiques (ex: Yaoundé, Douala, Bafoussam) rattachés à la session.

### 2. Apprenants & Contrats (`apprenant`, `inscription`, `dossier`)
- **Apprenant** : Données personnelles, lycée d'origine, série, contacts tuteurs.
- **Admission & Inscription** : Statut Pré-inscrit (acompte versé) ou Inscrit Définitif.
- **Contrats d'engagement pédagogique** :
  - Contrat initial d'admission.
  - Avenants contractuels négociés à chaque nouvelle **Phase Pédagogique** (Phase 1, Phase 2, etc.).
  - Imputation comptable des versements selon la règle **FIFO** : le montant total versé comble d'abord le contrat initial puis les avenants successifs.

### 3. Pédagogie & Progression (`academie`)
- Formations / Concours cibles (ex: Polytechnique, ENSP, FMSB, IDE, etc.).
- Phases pédagogiques séquentielles associées à un calendrier.
- Matières, chapitres du programme et suivi du pourcentage d'avancement des enseignants.

### 4. Personnel, Enseignants & Paie (`personnel`, `remuneration`, `gelenseignants`)
- Registre unique des ressources humaines (enseignants, directeurs, surveillants, comptables).
- Affectation des enseignants par matière, classe et semaine relative.
- Suivi du volume horaire effectué vs prévu.
- Gestion de la paie en deux temps : **Programmation** (préparation des états) puis **Exécution** (décaissement réel avec génération des fiches de paie).

### 5. Concours Blancs (`concours-blancs`)
- Planification des concours blancs par session et par centre.
- Saisie des notes, pondération par coefficients officiels de concours.
- Classement national et classement par centre physique.
- Édition et impression des bulletins et fiches récapitulatives.

### 6. Finances & Trésorerie (`financier`)
- **Mouvements financiers** :
  - `ENTREE` : Versements de scolarité, frais de dossier, vente d'ouvrages, etc.
  - `SORTIE` : Dépenses opérationnelles avec ordonnateur obligatoire.
- **Bilan Journalier (`BilanJournalier`)** :
  - Cycle de vie : `OUVERT` -> `EN_ATTENTE_CONTROLEUR` -> `CLOTURE`.
  - Calcul dynamique de la caisse journalière (Entrées - Sorties).
  - Ventilation des recettes par formation et par mode de règlement.
- 🔒 **RÈGLE D'OR MÉTIER (CRUD Versements)** :
  - **La modification (`PUT /api/entrees/{id}`) ou la suppression (`DELETE /api/entrees/{id}`) d'une entrée n'est autorisée QUE si le bilan journalier correspondant n'a pas encore été validé/clôturé.**
  - Si un bilan journalier existe déjà pour le centre, la session et la date du mouvement, le backend bloque strictement l'opération avec une exception `BilanDejaValideException` (**HTTP 409 Conflict**).
  - Côté interface, un cadenas `Lock` apparaît automatiquement dès que le bilan est validé, interdisant toute altération frauduleuse ou rétroactive.

### 7. Ouvrages & Ventes de Livres (`livre`)
- **Catalogue d'ouvrages** : Titre, prix de vente unitaire, statut actif/inactif.
- **Flux continu des ventes** : La colonne de stock statique a été retirée (migration Flyway `V21`) pour privilégier un suivi dynamique et exhaustif des flux de vente.
- **Traçabilité multi-niveaux** :
  - Vente à des **élèves inscrits** (sélectionnés via combobox) ou à des **acheteurs externes**.
  - Génération automatique de l'encaissement financier correspondant (`motif: Achat de livres`).
  - Si le versement financier lié à une vente est supprimé, les enregistrements correspondants dans `ventes_livres` sont automatiquement purgés.
  - Vues d'analyse : ventilation par nom d'ouvrage, répartition multi-centres pour la direction, et journal horodaté des transactions.

---

## 4. 👥 Matrice des Rôles & Accès

| Rôle | Périmètre de données | Actions Clés |
| :--- | :--- | :--- |
| `DIRECTEUR` / `ADMIN` | National (Tous centres) | Supervision financière globale, paramétrage des sessions, validation paie, archives. |
| `DIRECTEUR_ACADEMIQUE` | National (Académique) | Gestion des programmes, formations, catalogue des livres, concours blancs, suivi de progression. |
| `CHEF_CENTRE` | Local (Son centre uniquement) | Inscriptions, encaissements, ventes d'ouvrages, soumission du bilan journalier de caisse, affectations locales. |
| `CHEF_DEPARTEMENT` | Département / Filière | Suivi de l'avancement des chapitres par matière, validation des vacations des enseignants. |
| `COMPTABLE` / `CAISSIER` | Trésorerie & Caisse | Clôture et validation des bilans journaliers de tous les centres, émission des fiches de paie. |

---

## 5. 🛠️ Environnement & Commandes Essentielles

### ⚙️ Variables d'Environnement & Chemins
- **Java 21** : Présent sur la machine hôte sous `/usr/lib/jvm/java-21-openjdk-amd64`. Toujours exporter `JAVA_HOME` lors des commandes Maven.
- **Node.js** : Version 24 gérée via NVM (`/home/ghost/.nvm/versions/node/v24.15.0/bin`).

### 🔨 Commandes Backend (depuis `/backend`)
```bash
# Compilation et vérification des types
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw compile

# Exécution des tests unitaires
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw test

# Démarrage du serveur Spring Boot
JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64 ./mvnw spring-boot:run
```

### ⚡ Commandes Frontend (depuis `/frontend`)
```bash
# Export du PATH Node si nécessaire
export PATH=$PATH:/home/ghost/.nvm/versions/node/v24.15.0/bin

# Build de production (vérification TypeScript stricte et compilation Turbopack)
npm run build

# Démarrage en mode développement
npm run dev

# Linter
npm run lint
```

### 🗄️ Base de données & Migrations Flyway
- Les scripts de migration SQL se trouvent dans `backend/src/main/resources/db/migration/`.
- Convention de nommage : `V{Numero}__{description_en_minuscules}.sql`.
- **Règle absolue** : Ne jamais modifier une migration déjà appliquée en base. Toujours créer une nouvelle version incrémentale (`V22__...`).

---

## 6. 🚨 Règles de Conduite pour les Agents IA

1. **Respect absolu de l'Architecture Hexagonale** :
   - Ne jamais injecter d'entités JPA (`@Entity`) ni de dépendances Spring dans les classes du package `domain`.
   - Tout nouveau besoin métier commence par un port entrant (`...UseCase`) et un port sortant (`...RepositoryPort`).
2. **Intégrité Comptable & Financière** :
   - Ne jamais court-circuiter la vérification d'existence ou de validation du `BilanJournalier` lors d'une opération sur les entrées/sorties financières.
   - En cas d'annulation financière, toujours s'assurer que les flux dépendants (ex: lignes de vente de livres) sont correctement nettoyés.
3. **Expérience Utilisateur & Fluidité UI** :
   - Utiliser systématiquement les composants squelettes (`Skeleton`, `SkeletonCard`, `SkeletonTable`) lors des chargements asynchrones pour bannir les sauts de mise en page (*layout shift*).
   - Utiliser TanStack Query pour l'invalidation automatique des caches après chaque mutation (`useMutation`).
4. **Environnement Linux & Sandbox** :
   - Spécifier le `JAVA_HOME` JDK 21 lors de l'appel à Maven.
   - Utiliser `BypassSandbox: true` pour les opérations Git (`commit`, `push`) nécessitant l'accès en écriture au verrou `.git/index.lock`.

