-- Index sur les colonnes filtrées par les requêtes les plus fréquentes (bilans journaliers,
-- grand livre, listes financières, planning, effectifs). Jusqu'ici ces tables n'avaient que
-- leur clé primaire (et, pour affectations, la contrainte unique salle/jour/semaine/séance),
-- donc chaque lecture faisait un parcours complet de la table.
--
-- Pas de CREATE INDEX CONCURRENTLY : Flyway exécute la migration dans une transaction.
-- Les tables sont encore petites, le verrou d'écriture pendant la création est bref.

-- mouvements_financiers (entrées + sorties)
-- findByCentreIdAndSessionIdAndDate[AndStatut], findBySessionIdAndCentreId[AndStatut]
CREATE INDEX IF NOT EXISTS idx_mvt_centre_session_date_statut
    ON mouvements_financiers (centre_id, session_id, date, statut);
-- findBySessionId, findBySessionIdAndStatut (vues nationales, validations en attente)
CREATE INDEX IF NOT EXISTS idx_mvt_session_statut
    ON mouvements_financiers (session_id, statut);
-- Versements d'un apprenant, paiements d'un dossier, mouvements d'un bilan
CREATE INDEX IF NOT EXISTS idx_mvt_apprenant
    ON mouvements_financiers (apprenant_id) WHERE apprenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mvt_dossier_concours
    ON mouvements_financiers (dossier_concours_id) WHERE dossier_concours_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_mvt_bilan_journalier
    ON mouvements_financiers (bilan_journalier_id) WHERE bilan_journalier_id IS NOT NULL;

-- apprenants : findByCentreIdAndSessionId, countByCentreIdAndSessionId[AndDateInscription]
CREATE INDEX IF NOT EXISTS idx_apprenants_centre_session_inscription
    ON apprenants (centre_id, session_id, date_inscription);

-- affectations (planning, progression, paie)
-- findBySessionIdAndSemaine, findBySessionIdAndCentreIdAndSemaine
CREATE INDEX IF NOT EXISTS idx_affectations_session_semaine_centre
    ON affectations (session_id, semaine, centre_id);
-- findBySessionIdAndMatiereIdAndSemaine[AndCentreId]
CREATE INDEX IF NOT EXISTS idx_affectations_session_matiere_semaine
    ON affectations (session_id, matiere_id, semaine);
-- findByEnseignantId[AndSessionId...] (conflits horaires, paie)
CREATE INDEX IF NOT EXISTS idx_affectations_enseignant_session
    ON affectations (enseignant_id, session_id) WHERE enseignant_id IS NOT NULL;
-- findByFichePaieId
CREATE INDEX IF NOT EXISTS idx_affectations_fiche_paie
    ON affectations (fiche_paie_id) WHERE fiche_paie_id IS NOT NULL;
