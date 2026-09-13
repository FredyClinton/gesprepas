-- Migration V16 : Verrouillage de la saisie des notes au niveau des centres par le DA
ALTER TABLE concours_blancs ADD COLUMN IF NOT EXISTS saisie_notes_bloquee_centre BOOLEAN NOT NULL DEFAULT FALSE;

