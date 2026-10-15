-- V28 : Enrichissement des bilans journaliers pour le cycle de validation à 3 visas et indicateurs
ALTER TABLE bilans_journaliers ALTER COLUMN date_validation_chef_centre DROP NOT NULL;
ALTER TABLE bilans_journaliers ALTER COLUMN validateur_chef_centre_id DROP NOT NULL;

ALTER TABLE bilans_journaliers ADD COLUMN IF NOT EXISTS date_visa_caissier TIMESTAMP;
ALTER TABLE bilans_journaliers ADD COLUMN IF NOT EXISTS caissier_id UUID;
ALTER TABLE bilans_journaliers ADD COLUMN IF NOT EXISTS nom_caissier VARCHAR(255);
ALTER TABLE bilans_journaliers ADD COLUMN IF NOT EXISTS nom_chef_centre VARCHAR(255);
ALTER TABLE bilans_journaliers ADD COLUMN IF NOT EXISTS nom_controleur VARCHAR(255);
ALTER TABLE bilans_journaliers ADD COLUMN IF NOT EXISTS nombre_salles INTEGER;
ALTER TABLE bilans_journaliers ADD COLUMN IF NOT EXISTS nombre_cours INTEGER;
