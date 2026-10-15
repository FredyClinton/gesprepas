# Spécification Technique & Fonctionnelle : Journalisation des Événements & Audit Métier

- **Date :** 15 Octobre 2026
- **Auteur :** Antigravity AI
- **Statut :** Validé par l'utilisateur (En attente de revue finale)
- **Module :** Audit & Traçabilité (`audit_logs`)

---

## 1. Contexte & Objectifs

Dans le cadre du pilotage des centres de formation **EXCELIS PRÉPAS**, il est essentiel d'assurer une traçabilité rigoureuse et inaltérable des actions effectuées par les utilisateurs (comptables, caissiers, chefs de centre, directeurs).

L'objectif de ce sous-système est de fournir :
1. Une **journalisation automatique et asynchrone** des actions métier critiques.
2. Un **historique clair en langage naturel** avec un instantané JSON des données modifiées.
3. Une **interface de supervision centralisée** (`/audit`) permettant aux profils habilités de filtrer, rechercher et consulter les détails de chaque événement sans ralentir l'application.

---

## 2. Périmètre Cible

### En scope (Phase 1)
1. **Finances & Caisse** :
   - Enregistrement / modification de versements bancaires.
   - Enregistrement des mouvements de caisse (entrées et dépenses).
   - Ventes de livres et supports pédagogiques.
2. **Bilans Journaliers** :
   - Clôture / mise à jour des bilans journaliers de centre.
   - Apposition des visas (Visa Directeur, Visa Comptable, Visa Superviseur).
3. **Apprenants & Inscriptions** :
   - Création / mise à jour de dossier apprenant.
   - Émission ou résiliation de contrat de formation.
   - Application d'une remise ou modification tarifaire.
4. **Interface de consultation** :
   - Page dédiée `/audit` avec filtres par module, centre, période, utilisateur et recherche textuelle.
   - Modale d'inspection des métadonnées et snapshot JSON.

### Hors scope (Non-goals)
- Historisation automatique de chaque table de la base de données (CDC / Hibernate Envers).
- Journalisation des requêtes HTTP brutes GET (logs de navigation simples).

---

## 3. Schéma de Données & Migration SQL

### Migration Flyway : `V30__table_audit_logs.sql`

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Acteur de l'action
    utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
    utilisateur_nom VARCHAR(255),
    utilisateur_email VARCHAR(255),
    utilisateur_role VARCHAR(100),
    
    -- Centre concerné
    centre_id UUID REFERENCES centres(id) ON DELETE SET NULL,
    centre_nom VARCHAR(255),
    
    -- Métier & Action
    module VARCHAR(50) NOT NULL,           -- 'FINANCE', 'BILAN_JOURNALIER', 'INSCRIPTION', etc.
    type_action VARCHAR(100) NOT NULL,     -- 'CREATION_VERSEMENT', 'VISA_DIRECTEUR', etc.
    description VARCHAR(500) NOT NULL,     -- Libellé lisible en langage naturel
    
    -- Entité ciblée
    entite_type VARCHAR(100),              -- 'MouvementFinancier', 'BilanJournalier', 'ContratFormation'
    entite_id VARCHAR(255),
    
    -- Statut & Contexte
    statut VARCHAR(20) NOT NULL DEFAULT 'SUCCES', -- 'SUCCES', 'ECHEC'
    details JSONB,                         -- Clés/valeurs contextuelles sérialisées
    adresse_ip VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_centre_id ON audit_logs(centre_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_utilisateur_id ON audit_logs(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entite ON audit_logs(entite_type, entite_id);
```

---

## 4. Architecture Backend (Spring Boot 4 / Java 21)

### 4.1 Modèle de Domaine & Événements

1. **`AuditModule` (Enum)** :
   `FINANCE`, `BILAN_JOURNALIER`, `INSCRIPTION`, `PAIE`, `ADMINISTRATION`.

2. **`AuditLogEvent` (Record / DTO)** :
   Contient tous les champs requis pour construire une entrée d'audit.

3. **`AuditEventPublisherHelper`** :
   Composant Spring injecté dans les services :
   - Détermine automatiquement l'utilisateur connecté via `SecurityContextHolder`.
   - Récupère le nom, le rôle et le centre de l'utilisateur.
   - Construit l'objet `AuditLogEvent` et l'émet via `ApplicationEventPublisher`.

4. **`AuditLogListener`** :
   - Écoute les `AuditLogEvent` avec `@Async` et `@Transactional(propagation = Propagation.REQUIRES_NEW)`.
   - Mappe vers l'entité JPA `AuditLog`.
   - Persiste via `AuditLogRepository`.
   - **Résilience** : Encas d'exception (ex: DB temporairement surchargée), l'erreur est logguée (`log.error`) sans faire échouer la transaction métier de l'utilisateur.

### 4.2 Points d'Interception Initiaux

| Module | Service / Déclencheur | Action auditée | Description type |
| :--- | :--- | :--- | :--- |
| **FINANCE** | `MouvementFinancierService` / Versements | `CREATION_VERSEMENT` | Versement bancaire de X FCFA enregistré pour [Nom Apprenant] |
| **FINANCE** | `VenteLivreService` | `VENTE_LIVRE` | Vente de X livre(s) pour un total de Y FCFA |
| **BILAN** | `BilanJournalierService` | `CLOTURE_BILAN` | Clôture du bilan journalier du centre [Centre] pour le [Date] |
| **BILAN** | `BilanJournalierService` | `VISA_DIRECTEUR` / `VISA_COMPTABLE` | Visa [Rôle] apposé sur le bilan du [Date] |
| **INSCRIPTION** | `ApprenantService` / `ContratService` | `CREATION_APPRENANT` | Création de la fiche apprenant [Nom Apprenant] |
| **INSCRIPTION** | `ContratFormationService` | `CREATION_CONTRAT` | Contrat de formation généré (Montant : X FCFA) |

### 4.3 API REST (`AuditLogController`)

- **Route :** `GET /api/audit-logs`
- **Sécurité :** `@PreAuthorize("hasAnyRole('DIRECTEUR', 'DIRECTEUR_ACADEMIQUE', 'CHEF_CENTRE')")`
- **Paramètres :**
  - `page` (défaut: 0), `size` (défaut: 20)
  - `module` (optionnel)
  - `centreId` (optionnel)
  - `utilisateurId` (optionnel)
  - `dateDebut` & `dateFin` (optionnel, ISO-8601)
  - `recherche` (optionnel, recherche insensible à la casse sur description et nom d'utilisateur)
- **Retour :** `Page<AuditLogResponseDto>`

---

## 5. Interface Frontend (Next.js / React / Tailwind)

### 5.1 Navigation & Accès
- Ajout de l'entrée dans `nav-items.ts` :
  - Libellé : **"Journal d'audit"**
  - Route : `/audit`
  - Rôles autorisés : `DIRECTEUR`, `DIRECTEUR_ACADEMIQUE`, `CHEF_CENTRE`.

### 5.2 Page `/audit`
1. **En-tête** : Titre "Journal d'audit & Traçabilité", description, bouton d'export CSV.
2. **Barre de filtres** :
   - Champ de recherche (filtre instantané avec debounce).
   - Sélecteur de module (`Tous`, `Finances`, `Bilans Journaliers`, `Inscriptions`).
   - Sélecteur de centre.
   - Période de dates (début / fin).
3. **Tableau des événements** :
   - Horodatage formaté (JJ/MM/AAAA HH:mm).
   - Auteur (Avatar initiales, Nom complet, badge de rôle).
   - Centre (Badge).
   - Module & Action (Badges avec code couleur distinct).
   - Résumé textuel.
   - Bouton d'action "Voir le détail".
4. **Modale Détails de l'événement** :
   - Identifiant unique d'audit & adresse IP.
   - Type et ID de l'entité ciblée.
   - Affichage structuré du snapshot `details` (clés/valeurs lisibles).
   - Onglet / accordéon optionnel pour le JSON brut.

---

## 6. Stratégie de Test & Validation

1. **Tests unitaires & intégration Backend** :
   - Test de publication d'événement asynchrone (`@AsyncListener`).
   - Test de non-régression si l'audit échoue (la transaction métier continue normalement).
   - Test des filtres de requêtes dans `AuditLogRepository` (spécification JPA / requêtes paginées).
2. **Tests Frontend** :
   - Rendu du tableau avec mock d'événements.
   - Vérification du bon fonctionnement des filtres et de la pagination.
   - Ouverture et affichage de la modale de détails.
