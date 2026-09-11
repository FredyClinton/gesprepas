-- Migration V11: Ajout de chef_id dans departements pour permettre à un chef de diriger plusieurs départements

ALTER TABLE departements ADD COLUMN IF NOT EXISTS chef_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_departements_chef_id ON departements(chef_id);

-- Migration des données existantes depuis utilisateurs vers departements
UPDATE departements d
SET chef_id = u.id
FROM utilisateurs u
WHERE u.departement_id = d.id AND d.chef_id IS NULL;

