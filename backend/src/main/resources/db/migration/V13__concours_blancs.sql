CREATE TABLE IF NOT EXISTS concours_blancs (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions_academiques(id) ON DELETE CASCADE,
    titre VARCHAR(255) NOT NULL,
    numero INT NOT NULL,
    date_epreuve DATE NOT NULL,
    jour VARCHAR(20) NOT NULL,
    semaine INT NOT NULL,
    statut VARCHAR(30) NOT NULL DEFAULT 'PROGRAMME',
    seance_debut INT NOT NULL DEFAULT 1,
    seance_fin INT NOT NULL DEFAULT 3,
    tous_les_centres BOOLEAN NOT NULL DEFAULT TRUE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS concours_blancs_centres (
    concours_blanc_id UUID NOT NULL REFERENCES concours_blancs(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
    PRIMARY KEY (concours_blanc_id, centre_id)
);

CREATE TABLE IF NOT EXISTS epreuves_concours_blanc (
    id UUID PRIMARY KEY,
    concours_blanc_id UUID NOT NULL REFERENCES concours_blancs(id) ON DELETE CASCADE,
    formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    matiere_id UUID NOT NULL REFERENCES matieres(id) ON DELETE CASCADE,
    intitule VARCHAR(255),
    duree_minutes INT NOT NULL DEFAULT 120,
    note_max NUMERIC(5,2) NOT NULL DEFAULT 20.00,
    coefficient NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    contenu_evaluation TEXT,
    consignes TEXT,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resultats_candidats_concours_blanc (
    id UUID PRIMARY KEY,
    concours_blanc_id UUID NOT NULL REFERENCES concours_blancs(id) ON DELETE CASCADE,
    formation_id UUID NOT NULL REFERENCES formations(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
    apprenant_id UUID REFERENCES apprenants(id) ON DELETE SET NULL,
    nom_complet VARCHAR(255) NOT NULL,
    etablissement_origine VARCHAR(255),
    hors_liste BOOLEAN NOT NULL DEFAULT FALSE,
    total_pondere NUMERIC(8,2),
    moyenne_ponderee NUMERIC(5,2),
    rang INT,
    rang_centre INT,
    delta_rang INT
);

CREATE TABLE IF NOT EXISTS notes_epreuves_candidat (
    id UUID PRIMARY KEY,
    resultat_candidat_id UUID NOT NULL REFERENCES resultats_candidats_concours_blanc(id) ON DELETE CASCADE,
    epreuve_id UUID NOT NULL REFERENCES epreuves_concours_blanc(id) ON DELETE CASCADE,
    note NUMERIC(5,2),
    statut VARCHAR(20) NOT NULL DEFAULT 'NOTE'
);

CREATE INDEX IF NOT EXISTS idx_cb_session ON concours_blancs(session_id);
CREATE INDEX IF NOT EXISTS idx_epreuve_cb ON epreuves_concours_blanc(concours_blanc_id);
CREATE INDEX IF NOT EXISTS idx_resultat_cb ON resultats_candidats_concours_blanc(concours_blanc_id);
CREATE INDEX IF NOT EXISTS idx_note_resultat ON notes_epreuves_candidat(resultat_candidat_id);

