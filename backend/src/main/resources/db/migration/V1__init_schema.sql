CREATE TABLE IF NOT EXISTS personnel (
    id UUID NOT NULL,
    mode_calcul_paie VARCHAR(255) CHECK ((mode_calcul_paie IN ('FIXE','PAR_SEANCE'))),
    nom VARCHAR(255),
    prenom VARCHAR(255),
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS enseignants (
    cout_par_seance NUMERIC(12,2) NOT NULL,
    id UUID NOT NULL,
    matricule VARCHAR(255) NOT NULL UNIQUE,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS utilisateurs (
    centre_id UUID,
    id UUID NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL CHECK ((role IN ('DIRECTEUR','DIRECTEUR_ACADEMIQUE','CHEF_CENTRE','CHEF_DEPARTEMENT','CHARGE_DOSSIER','SUPERVISEUR_DOSSIERS','CAISSIER','COMPTABLE'))),
    PRIMARY KEY (id)
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fkeuxc6j7dda1k7lioar5x54qbc') THEN
        ALTER TABLE enseignants ADD CONSTRAINT fkeuxc6j7dda1k7lioar5x54qbc FOREIGN KEY (id) REFERENCES personnel(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fkm6u31ywavy2xcrnp5l8aer4et') THEN
        ALTER TABLE utilisateurs ADD CONSTRAINT fkm6u31ywavy2xcrnp5l8aer4et FOREIGN KEY (id) REFERENCES personnel(id);
    END IF;
END $$;
