-- Migration V18: Table dédiée aux établissements scolaires d'origine
CREATE TABLE IF NOT EXISTS etablissements (
    id UUID PRIMARY KEY,
    nom VARCHAR(255) NOT NULL UNIQUE,
    ville VARCHAR(100),
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertion des établissements scolaires de référence
INSERT INTO etablissements (id, nom, ville) VALUES
('a1000000-0000-0000-0000-000000000001', 'Lycée Général Leclerc', 'Yaoundé'),
('a1000000-0000-0000-0000-000000000002', 'Collège François-Xavier Vogt', 'Yaoundé'),
('a1000000-0000-0000-0000-000000000003', 'Collège Libermann', 'Douala'),
('a1000000-0000-0000-0000-000000000004', 'Lycée Joss', 'Douala'),
('a1000000-0000-0000-0000-000000000005', 'Lycée Bilingue d''Application', 'Yaoundé'),
('a1000000-0000-0000-0000-000000000006', 'Collège Jean Tabi', 'Yaoundé'),
('a1000000-0000-0000-0000-000000000007', 'Lycée Bilingue de Bonabéri', 'Douala'),
('a1000000-0000-0000-0000-000000000008', 'Lycée Classique de Bafoussam', 'Bafoussam'),
('a1000000-0000-0000-0000-000000000009', 'Collège de la Retraite', 'Yaoundé'),
('a1000000-0000-0000-0000-000000000010', 'Lycée Bilingue d''Essos', 'Yaoundé'),
('a1000000-0000-0000-0000-000000000011', 'Lycée d''Akwa', 'Douala')
ON CONFLICT (nom) DO NOTHING;

