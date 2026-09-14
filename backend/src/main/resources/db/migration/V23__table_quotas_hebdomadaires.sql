CREATE TABLE IF NOT EXISTS quotas_hebdomadaires (
    id UUID PRIMARY KEY,
    formation_id UUID NOT NULL REFERENCES formations(id),
    session_id UUID NOT NULL REFERENCES sessions_academiques(id),
    matiere_id UUID NOT NULL REFERENCES matieres(id),
    semaine INT NOT NULL,
    quota INT NOT NULL,
    UNIQUE (formation_id, session_id, matiere_id, semaine)
);

CREATE INDEX IF NOT EXISTS idx_quotas_hebdomadaires_formation_session
    ON quotas_hebdomadaires(formation_id, session_id);
