-- 1. Normalisation de la table personnel
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS numero_cni VARCHAR(100);
ALTER TABLE personnel ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Migration des données existantes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'utilisateurs' AND column_name = 'email') THEN
        UPDATE personnel p SET email = u.email FROM utilisateurs u WHERE p.id = u.id AND p.email IS NULL;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enseignants' AND column_name = 'telephone') THEN
        UPDATE personnel p SET telephone = e.telephone, numero_cni = e.numero_cni FROM enseignants e WHERE p.id = e.id AND p.telephone IS NULL;
    END IF;
END $$;

-- Contrainte d'unicité sur l'email dans personnel
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_personnel_email' OR conname = 'ukspw3be4srpjk4419oma5k7uki') THEN
        ALTER TABLE personnel ADD CONSTRAINT uq_personnel_email UNIQUE (email);
    END IF;
END $$;

-- Nettoyage des colonnes devenues inutiles
ALTER TABLE personnel DROP COLUMN IF EXISTS mode_calcul_paie;
ALTER TABLE utilisateurs DROP COLUMN IF EXISTS email;
ALTER TABLE utilisateurs DROP COLUMN IF EXISTS departement_id;
ALTER TABLE enseignants DROP COLUMN IF EXISTS telephone;
ALTER TABLE enseignants DROP COLUMN IF EXISTS numero_cni;

-- 2. Table Historique des Salaires du Personnel par Session
CREATE TABLE IF NOT EXISTS historique_salaires_personnel (
    id UUID PRIMARY KEY,
    personnel_id UUID NOT NULL,
    session_id UUID NOT NULL,
    salaire_reference DECIMAL(12,2) NOT NULL,
    date_debut_effet DATE NOT NULL,
    date_modification TIMESTAMP NOT NULL,
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE
);

-- 3. Table Bordereaux de Paie du Personnel
CREATE TABLE IF NOT EXISTS bordereaux_paie_personnel (
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
CREATE TABLE IF NOT EXISTS fiches_paie_personnel (
    id UUID PRIMARY KEY,
    bordereau_id UUID NOT NULL,
    personnel_id UUID NOT NULL,
    salaire_reference DECIMAL(12,2) NOT NULL,
    montant_paye DECIMAL(12,2) NOT NULL,
    observations TEXT,
    FOREIGN KEY (bordereau_id) REFERENCES bordereaux_paie_personnel(id) ON DELETE CASCADE,
    FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE
);
