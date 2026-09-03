-- 1. Normalisation de la table personnel
ALTER TABLE personnel ADD COLUMN telephone VARCHAR(50);
ALTER TABLE personnel ADD COLUMN numero_cni VARCHAR(100);
ALTER TABLE personnel ADD COLUMN email VARCHAR(255);

-- Migration des données existantes
UPDATE personnel p SET email = u.email FROM utilisateurs u WHERE p.id = u.id;
UPDATE personnel p SET telephone = e.telephone, numero_cni = e.numero_cni FROM enseignants e WHERE p.id = e.id;

-- Contrainte d'unicité sur l'email dans personnel
ALTER TABLE personnel ADD CONSTRAINT uq_personnel_email UNIQUE (email);

-- Nettoyage des colonnes devenues inutiles
ALTER TABLE personnel DROP COLUMN IF EXISTS mode_calcul_paie;
ALTER TABLE utilisateurs DROP COLUMN IF EXISTS email;
ALTER TABLE utilisateurs DROP COLUMN IF EXISTS departement_id;
ALTER TABLE enseignants DROP COLUMN IF EXISTS telephone;
ALTER TABLE enseignants DROP COLUMN IF EXISTS numero_cni;

-- 2. Table Historique des Salaires du Personnel par Session
CREATE TABLE historique_salaires_personnel (
    id UUID PRIMARY KEY,
    personnel_id UUID NOT NULL,
    session_id UUID NOT NULL,
    salaire_reference DECIMAL(12,2) NOT NULL,
    date_debut_effet DATE NOT NULL,
    date_modification TIMESTAMP NOT NULL,
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE
);

-- 3. Table Bordereaux de Paie du Personnel
CREATE TABLE bordereaux_paie_personnel (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    reference VARCHAR(255) NOT NULL UNIQUE,
    intitule VARCHAR(255) NOT NULL,
    date_paiement DATE NOT NULL,
    nombre_personnels_payes INT NOT NULL,
    montant_total_global DECIMAL(12,2) NOT NULL,
    sortie_id UUID NOT NULL,
    saisi_par VARCHAR(255) NOT NULL
);

-- 4. Table Fiches de Paie individuelles du Personnel
CREATE TABLE fiches_paie_personnel (
    id UUID PRIMARY KEY,
    bordereau_id UUID NOT NULL,
    personnel_id UUID NOT NULL,
    salaire_reference DECIMAL(12,2) NOT NULL,
    montant_paye DECIMAL(12,2) NOT NULL,
    observations TEXT,
    FOREIGN KEY (bordereau_id) REFERENCES bordereaux_paie_personnel(id) ON DELETE CASCADE,
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE
);
