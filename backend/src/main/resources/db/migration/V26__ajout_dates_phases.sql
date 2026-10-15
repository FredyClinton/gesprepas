-- Ajout des dates de début et de fin pour les phases académiques
ALTER TABLE phases ADD COLUMN IF NOT EXISTS date_debut DATE;
ALTER TABLE phases ADD COLUMN IF NOT EXISTS date_fin DATE;

