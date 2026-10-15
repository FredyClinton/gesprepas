-- V29: Suppression de l'ancienne contrainte d'unicité (centre_id, formation_id)
-- Les abonnements sont désormais scopés par session via (centre_id, formation_id, session_id)

ALTER TABLE centre_formation_abonnements DROP CONSTRAINT IF EXISTS ukbdeo76qoyhallkhq55thxl92s;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'centre_formation_abonnements'
          AND c.contype = 'u'
          AND (
              SELECT array_agg(a.attname::text ORDER BY a.attnum)
              FROM pg_attribute a
              JOIN unnest(c.conkey) k ON a.attnum = k
              WHERE a.attrelid = t.oid
          ) = ARRAY['centre_id', 'formation_id']
    ) LOOP
        EXECUTE 'ALTER TABLE centre_formation_abonnements DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;
