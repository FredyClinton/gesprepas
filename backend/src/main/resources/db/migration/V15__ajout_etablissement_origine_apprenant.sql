-- Migration V15: Ajout du champ etablissement_origine sur la table apprenants

ALTER TABLE apprenants ADD COLUMN IF NOT EXISTS etablissement_origine VARCHAR(255);

