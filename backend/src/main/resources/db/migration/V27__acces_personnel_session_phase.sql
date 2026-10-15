-- V27: Table de gestion des accès du personnel par session et phase
CREATE TABLE IF NOT EXISTS acces_personnel (
    id UUID PRIMARY KEY,
    personnel_id UUID NOT NULL,
    session_id UUID NOT NULL,
    phase_id UUID,
    statut VARCHAR(20) NOT NULL CHECK (statut IN ('ACCORDE', 'BLOQUE')),
    motif VARCHAR(255),
    date_modification TIMESTAMP NOT NULL,
    CONSTRAINT fk_acces_personnel_personnel FOREIGN KEY (personnel_id) REFERENCES personnel(id) ON DELETE CASCADE,
    CONSTRAINT fk_acces_personnel_session FOREIGN KEY (session_id) REFERENCES sessions_academiques(id) ON DELETE CASCADE,
    CONSTRAINT fk_acces_personnel_phase FOREIGN KEY (phase_id) REFERENCES phases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_acces_personnel_session ON acces_personnel (session_id);
CREATE INDEX IF NOT EXISTS idx_acces_personnel_pers_sess ON acces_personnel (personnel_id, session_id);
CREATE INDEX IF NOT EXISTS idx_acces_personnel_pers_sess_phase ON acces_personnel (personnel_id, session_id, phase_id);
