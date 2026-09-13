-- Migration V14: Centres concernés et Rang Centre pour les Concours Blancs

ALTER TABLE concours_blancs ADD COLUMN IF NOT EXISTS tous_les_centres BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS concours_blancs_centres (
    concours_blanc_id UUID NOT NULL REFERENCES concours_blancs(id) ON DELETE CASCADE,
    centre_id UUID NOT NULL REFERENCES centres(id) ON DELETE CASCADE,
    PRIMARY KEY (concours_blanc_id, centre_id)
);

CREATE INDEX IF NOT EXISTS idx_cb_centres_cb ON concours_blancs_centres(concours_blanc_id);
CREATE INDEX IF NOT EXISTS idx_cb_centres_centre ON concours_blancs_centres(centre_id);

ALTER TABLE resultats_candidats_concours_blanc ADD COLUMN IF NOT EXISTS rang_centre INT;
