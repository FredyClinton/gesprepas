-- Colonnes de `enseignants` jusqu'ici ajoutées par Hibernate (ddl-auto=update) sur
-- les bases existantes, mais absentes des migrations : une base neuve créée par
-- Flyway échouait à la validation du schéma (ddl-auto=validate).
-- Idempotent : sans effet sur les bases qui ont déjà ces colonnes.
ALTER TABLE enseignants ADD COLUMN IF NOT EXISTS statut VARCHAR(255) NOT NULL DEFAULT 'ACTIF';
ALTER TABLE enseignants ALTER COLUMN statut DROP DEFAULT;
ALTER TABLE enseignants ADD COLUMN IF NOT EXISTS ecole_fonction VARCHAR(255);
ALTER TABLE enseignants ADD COLUMN IF NOT EXISTS niveau_grade VARCHAR(255);
