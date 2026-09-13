-- Migration V19: Gestion des livres et motif d'entrée pour l'achat de livres

-- 1. Table des livres / supports pédagogiques
CREATE TABLE IF NOT EXISTS livres (
    id UUID PRIMARY KEY,
    titre VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    prix NUMERIC(12, 2) NOT NULL CHECK (prix >= 0),
    stock INTEGER NOT NULL DEFAULT 0,
    actif BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insertion des 7 livres officiels
INSERT INTO livres (id, titre, description, prix, stock, actif) VALUES
('b1000000-0000-0000-0000-000000000001', 'AXIOME', 'Manuel de référence pour la préparation aux concours scientifiques et techniques', 10000.00, 100, true),
('b1000000-0000-0000-0000-000000000002', 'VECTEUR', 'Recueil d''exercices et problèmes corrigés de physique et mathématiques', 9000.00, 100, true),
('b1000000-0000-0000-0000-000000000003', 'ARTEFACT', 'Guide méthodologique et annales corrigées pour écoles d''ingénieurs', 10000.00, 100, true),
('b1000000-0000-0000-0000-000000000004', 'GENE', 'Ouvrage fondamental de biologie et sciences de la santé pour concours médicaux', 10000.00, 100, true),
('b1000000-0000-0000-0000-000000000005', 'BIOTOPE', 'Synthèse illustrée et fiches pratiques des sciences du vivant', 9000.00, 100, true),
('b1000000-0000-0000-0000-000000000006', 'ARCHE', 'Annales officielles et sujets types pour concours paramédicaux et santé', 9000.00, 100, true),
('b1000000-0000-0000-0000-000000000007', 'POULS', 'Manuel d''entraînement intensif aux épreuves de médecine et biomédical', 10000.00, 100, true)
ON CONFLICT (titre) DO NOTHING;

-- 3. Ajout des motifs d'entrée officiels dans la table motifs
INSERT INTO motifs (id, nom, type, actif) VALUES
('00000000-0000-0000-0000-000000000010', 'Scolarité / Tranches', 'ENTREE', true),
('00000000-0000-0000-0000-000000000011', 'Acompte / Inscription', 'ENTREE', true),
('00000000-0000-0000-0000-000000000012', 'Achat Livres', 'ENTREE', true),
('00000000-0000-0000-0000-000000000013', 'Frais Dossier Concours', 'ENTREE', true)
ON CONFLICT (id) DO UPDATE SET actif = true, nom = EXCLUDED.nom, type = EXCLUDED.type;

-- 4. Table de traçabilité des livres vendus par entrée financière
CREATE TABLE IF NOT EXISTS entree_livres (
    id UUID PRIMARY KEY,
    entree_id UUID NOT NULL REFERENCES mouvements_financiers(id) ON DELETE CASCADE,
    livre_id UUID NOT NULL REFERENCES livres(id),
    quantite INTEGER NOT NULL DEFAULT 1,
    prix_unitaire NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

