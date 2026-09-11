ALTER TABLE utilisateurs ADD COLUMN IF NOT EXISTS departement_id UUID;
CREATE INDEX IF NOT EXISTS idx_utilisateurs_departement_id ON utilisateurs(departement_id);

ALTER TABLE matieres ADD COLUMN IF NOT EXISTS couleur VARCHAR(50);

-- Initialisation des couleurs pour les matières existantes
UPDATE matieres SET couleur = '#10B981' WHERE nom ILIKE '%MATH%' AND couleur IS NULL;
UPDATE matieres SET couleur = '#3B82F6' WHERE nom ILIKE '%PHYS%' AND couleur IS NULL;
UPDATE matieres SET couleur = '#EF4444' WHERE nom ILIKE '%CHIM%' AND couleur IS NULL;
UPDATE matieres SET couleur = '#14B8A6' WHERE nom ILIKE '%BIO%' AND couleur IS NULL;
UPDATE matieres SET couleur = '#8B5CF6' WHERE nom ILIKE '%INFO%' AND couleur IS NULL;
UPDATE matieres SET couleur = '#F59E0B' WHERE (nom ILIKE '%ANGL%' OR nom ILIKE '%LANG%') AND couleur IS NULL;
UPDATE matieres SET couleur = '#EC4899' WHERE couleur IS NULL;

-- Initialisation du rattachement des chefs de département de seed existants s'ils existent
UPDATE utilisateurs SET departement_id = 'e5dce55c-3bae-4db5-b9f8-73d6d9dcb29c' WHERE id = 'f4e8facd-583c-4741-9ff5-b588a634d032' AND departement_id IS NULL;
UPDATE utilisateurs SET departement_id = '4eb4d0c7-e1bf-4bfa-806f-13494921f456' WHERE id = 'f24db0e9-2159-45e8-819a-9c5ed8f44a61' AND departement_id IS NULL;
UPDATE utilisateurs SET departement_id = '51d3ffe2-eeb8-4e7e-89d7-1be803403538' WHERE id = 'b2716158-dd1c-471b-bf56-16c692d2a9dd' AND departement_id IS NULL;
UPDATE utilisateurs SET departement_id = 'f3b17152-d30b-4de3-8cef-ccc3487c22f0' WHERE id = 'e14ed2f5-9b51-4402-a3dd-11ee9bb7f33f' AND departement_id IS NULL;
UPDATE utilisateurs SET departement_id = '5f719141-1366-4d2e-b0b3-95790d1f66a8' WHERE id = 'b0412337-a93b-4728-8f79-1c77b597fff2' AND departement_id IS NULL;
UPDATE utilisateurs SET departement_id = '55aa1f20-16b7-4fc9-b2f6-9360f80f51a4' WHERE id = 'acda22f4-640b-4f2f-8062-a72eecf09f1c' AND departement_id IS NULL;

