-- Migration V17: Ajout des colonnes formation_id, montant_contrat, pre_inscrit, reference_recu sur la table apprenants
ALTER TABLE apprenants ADD COLUMN IF NOT EXISTS formation_id UUID REFERENCES formations(id);
ALTER TABLE apprenants ADD COLUMN IF NOT EXISTS montant_contrat NUMERIC(12, 2);
ALTER TABLE apprenants ADD COLUMN IF NOT EXISTS pre_inscrit BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE apprenants ADD COLUMN IF NOT EXISTS reference_recu VARCHAR(100);

