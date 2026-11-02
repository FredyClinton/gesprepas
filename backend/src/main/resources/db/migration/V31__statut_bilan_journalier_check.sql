-- Migration V31: Mise à jour de la contrainte CHECK sur le statut des bilans journaliers pour autoriser SOUMIS_CAISSIER et OUVERT

ALTER TABLE bilans_journaliers DROP CONSTRAINT IF EXISTS bilans_journaliers_statut_check;

ALTER TABLE bilans_journaliers ADD CONSTRAINT bilans_journaliers_statut_check 
    CHECK (statut IN ('OUVERT', 'SOUMIS_CAISSIER', 'EN_ATTENTE_CONTROLEUR', 'CLOTURE'));
