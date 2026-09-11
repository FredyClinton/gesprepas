-- Migration V12 : Déduplication en cascade des matières et contrainte d'unicité sur le nom normalisé

DO $$
DECLARE
    rec RECORD;
    v_canonical_id UUID;
    v_dup_id UUID;
BEGIN
    FOR rec IN 
        SELECT UPPER(TRIM(nom)) as nom_norm
        FROM matieres
        GROUP BY UPPER(TRIM(nom))
        HAVING COUNT(*) > 1
    LOOP
        -- Sélectionner l'ID canonique (priorité à celle avec une couleur renseignée, sinon le premier ID)
        SELECT id INTO v_canonical_id
        FROM matieres
        WHERE UPPER(TRIM(nom)) = rec.nom_norm
        ORDER BY (couleur IS NOT NULL AND couleur != '') DESC, id ASC
        LIMIT 1;

        FOR v_dup_id IN
            SELECT id
            FROM matieres
            WHERE UPPER(TRIM(nom)) = rec.nom_norm AND id != v_canonical_id
        LOOP
            -- 1. Départements : réattacher la matière canonique
            UPDATE departements
            SET matiere_id = v_canonical_id
            WHERE matiere_id = v_dup_id;

            -- 2. Affectations (séances / enseignants) : réattacher la matière canonique
            UPDATE affectations
            SET matiere_id = v_canonical_id
            WHERE matiere_id = v_dup_id;

            -- 3. Formations_matieres : supprimer les doublons pour la même formation, puis réassigner
            DELETE FROM formations_matieres fm
            WHERE fm.matiere_id = v_dup_id
              AND EXISTS (
                  SELECT 1 FROM formations_matieres fm2
                  WHERE fm2.formation_id = fm.formation_id
                    AND fm2.matiere_id = v_canonical_id
              );

            UPDATE formations_matieres
            SET matiere_id = v_canonical_id
            WHERE matiere_id = v_dup_id;

            -- 4. Progressions (cours rédigés) : réattacher la matière canonique
            DELETE FROM progressions p
            WHERE p.matiere_id = v_dup_id
              AND EXISTS (
                  SELECT 1 FROM progressions p2
                  WHERE p2.formation_id = p.formation_id
                    AND p2.session_id = p.session_id
                    AND p2.phase_id = p.phase_id
                    AND p2.matiere_id = v_canonical_id
                    AND p2.semaine = p.semaine
                    AND p2.numero_cours = p.numero_cours
              );

            UPDATE progressions
            SET matiere_id = v_canonical_id
            WHERE matiere_id = v_dup_id;

            -- 5. Supprimer la matière en double
            DELETE FROM matieres WHERE id = v_dup_id;
        END LOOP;
    END LOOP;
END $$;

-- Création de l'index d'unicité insensible à la casse et aux espaces sur le nom de la matière
CREATE UNIQUE INDEX IF NOT EXISTS uq_matieres_nom_normalized ON matieres (UPPER(TRIM(nom)));

