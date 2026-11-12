-- Rattrapage : ces 33 tables n'étaient créées par aucune migration, seulement par
-- Hibernate (ddl-auto=update). Sur une base vide, Flyway (qui passe avant Hibernate)
-- échouait donc dès V19 (INSERT INTO motifs). Généré depuis le schéma Hibernate
-- des entités au 2026-11-11.
--
-- Version 1.1 pour s'exécuter avant V2 sur une base neuve. Sur une base existante
-- (V1..V31 déjà appliquées), elle passe en out-of-order (spring.flyway.out-of-order)
-- et ne change rien : tout est en CREATE ... IF NOT EXISTS, contraintes incluses
-- dans le CREATE TABLE.

CREATE TABLE IF NOT EXISTS affectations (
    cout_applique numeric(12,2),
    date_seance date,
    heure_debut time(0) without time zone,
    heure_fin time(0) without time zone,
    seance integer NOT NULL,
    semaine integer NOT NULL,
    centre_id uuid NOT NULL,
    enseignant_id uuid,
    fiche_paie_id uuid,
    formation_id uuid NOT NULL,
    id uuid NOT NULL,
    matiere_id uuid NOT NULL,
    salle_id uuid NOT NULL,
    session_id uuid NOT NULL,
    jour character varying(255) NOT NULL,
    statut character varying(255) NOT NULL,
    statut_paiement character varying(255) NOT NULL,
    CONSTRAINT affectations_jour_check CHECK (((jour)::text = ANY ((ARRAY['LUNDI'::character varying, 'MARDI'::character varying, 'MERCREDI'::character varying, 'JEUDI'::character varying, 'VENDREDI'::character varying, 'SAMEDI'::character varying])::text[]))),
    CONSTRAINT affectations_statut_check CHECK (((statut)::text = ANY ((ARRAY['PLANIFIEE'::character varying, 'ASSIGNEE'::character varying, 'EFFECTUEE'::character varying, 'ANNULEE'::character varying])::text[]))),
    CONSTRAINT affectations_statut_paiement_check CHECK (((statut_paiement)::text = ANY ((ARRAY['NON_PAYEE'::character varying, 'PROGRAMMEE'::character varying, 'PAYEE'::character varying])::text[]))),
    CONSTRAINT affectations_pkey PRIMARY KEY (id),
    CONSTRAINT affectations_salle_id_jour_semaine_seance_key UNIQUE (salle_id, jour, semaine, seance)
);

CREATE TABLE IF NOT EXISTS affectations_departementales (
    departement_id uuid NOT NULL,
    enseignant_id uuid NOT NULL,
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    CONSTRAINT affectations_departementales_enseignant_id_session_id_depar_key UNIQUE (enseignant_id, session_id, departement_id),
    CONSTRAINT affectations_departementales_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS apprenants (
    date_inscription date NOT NULL,
    date_naissance date NOT NULL,
    montant_contrat numeric(38,2),
    pre_inscrit boolean NOT NULL,
    centre_id uuid NOT NULL,
    formation_id uuid,
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    contact_apprenant character varying(255),
    contact_parent character varying(255),
    etablissement_origine character varying(255),
    nom character varying(255) NOT NULL,
    nom_parent character varying(255),
    prenom character varying(255) NOT NULL,
    reference_recu character varying(255),
    CONSTRAINT apprenants_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS attributions_role (
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    utilisateur_id uuid NOT NULL,
    role character varying(255) NOT NULL,
    CONSTRAINT attributions_role_role_check CHECK (((role)::text = ANY ((ARRAY['DIRECTEUR'::character varying, 'DIRECTEUR_ACADEMIQUE'::character varying, 'CHEF_CENTRE'::character varying, 'CHEF_DEPARTEMENT'::character varying, 'CHARGE_DOSSIER'::character varying, 'SUPERVISEUR_DOSSIERS'::character varying, 'CAISSIER'::character varying, 'COMPTABLE'::character varying])::text[]))),
    CONSTRAINT attributions_role_pkey PRIMARY KEY (id),
    CONSTRAINT attributions_role_utilisateur_id_session_id_role_key UNIQUE (utilisateur_id, session_id, role)
);

CREATE TABLE IF NOT EXISTS bilans_journaliers (
    date date NOT NULL,
    effectif_nouveaux_eleves integer,
    effectif_total_centre integer,
    net_a_verser numeric(38,2),
    nombre_cours integer,
    nombre_salles integer,
    total_entrees numeric(38,2),
    total_sorties numeric(38,2),
    date_validation_chef_centre timestamp(6) without time zone,
    date_validation_controleur timestamp(6) without time zone,
    date_visa_caissier timestamp(6) without time zone,
    caissier_id uuid,
    centre_id uuid NOT NULL,
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    validateur_chef_centre_id uuid,
    validateur_controleur_id uuid,
    nom_caissier character varying(255),
    nom_chef_centre character varying(255),
    nom_controleur character varying(255),
    statut character varying(255) NOT NULL,
    CONSTRAINT bilans_journaliers_statut_check CHECK (((statut)::text = ANY ((ARRAY['OUVERT'::character varying, 'SOUMIS_CAISSIER'::character varying, 'EN_ATTENTE_CONTROLEUR'::character varying, 'CLOTURE'::character varying])::text[]))),
    CONSTRAINT bilans_journaliers_centre_id_session_id_date_key UNIQUE (centre_id, session_id, date),
    CONSTRAINT bilans_journaliers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS centre_formation_abonnements (
    date_abonnement date NOT NULL,
    centre_id uuid NOT NULL,
    formation_id uuid NOT NULL,
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    CONSTRAINT centre_formation_abonnements_centre_id_formation_id_session_key UNIQUE (centre_id, formation_id, session_id),
    CONSTRAINT centre_formation_abonnements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS centres (
    id uuid NOT NULL,
    nom character varying(255) NOT NULL,
    statut character varying(255) NOT NULL,
    CONSTRAINT centres_statut_check CHECK (((statut)::text = ANY ((ARRAY['OUVERT'::character varying, 'FERME'::character varying])::text[]))),
    CONSTRAINT centres_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS centre_sessions (
    centre_id uuid NOT NULL,
    session_id uuid,
    CONSTRAINT fk2i8214x6n2kgmwnr9kf7ed4eo FOREIGN KEY (centre_id) REFERENCES centres(id)
);

CREATE TABLE IF NOT EXISTS concours (
    date_limite_depot date NOT NULL,
    date_limite_recevabilite_centre date NOT NULL,
    formation_id uuid NOT NULL,
    id uuid NOT NULL,
    phase_id uuid NOT NULL,
    session_id uuid NOT NULL,
    nom character varying(255) NOT NULL,
    CONSTRAINT concours_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS concours_pieces_requises (
    concours_id uuid NOT NULL,
    id uuid NOT NULL,
    piece_requise_id uuid NOT NULL,
    CONSTRAINT concours_pieces_requises_concours_id_piece_requise_id_key UNIQUE (concours_id, piece_requise_id),
    CONSTRAINT concours_pieces_requises_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS contrats_apprenants (
    date_signature date NOT NULL,
    montant_total numeric(12,2) NOT NULL,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    apprenant_id uuid NOT NULL,
    id uuid NOT NULL,
    statut character varying(30) NOT NULL,
    observations text,
    reference character varying(255) NOT NULL,
    CONSTRAINT contrats_apprenants_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_contrat_apprenant_id ON contrats_apprenants USING btree (apprenant_id);

CREATE TABLE IF NOT EXISTS departements (
    chef_id uuid,
    id uuid NOT NULL,
    matiere_id uuid NOT NULL,
    nom character varying(255) NOT NULL,
    CONSTRAINT departements_matiere_id_key UNIQUE (matiere_id),
    CONSTRAINT departements_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS dossiers_inscriptions (
    date_inscription date NOT NULL,
    montant_global numeric(38,2) NOT NULL,
    pre_inscrit boolean NOT NULL,
    apprenant_id uuid NOT NULL,
    centre_id uuid NOT NULL,
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    reference_recu character varying(255),
    CONSTRAINT dossiers_inscriptions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS dossier_concours (
    concours_id uuid,
    dossier_id uuid NOT NULL,
    CONSTRAINT fkg2igcwab1v6r3gpxohfa2r5wk FOREIGN KEY (dossier_id) REFERENCES dossiers_inscriptions(id)
);

CREATE TABLE IF NOT EXISTS dossier_formations (
    dossier_id uuid NOT NULL,
    formation_id uuid,
    CONSTRAINT fkh44rldwqb9v4cngubgf044g1o FOREIGN KEY (dossier_id) REFERENCES dossiers_inscriptions(id)
);

CREATE TABLE IF NOT EXISTS dossier_phases (
    dossier_id uuid NOT NULL,
    phase_id uuid,
    CONSTRAINT fkmrajx9k4pfhvqcue9tghmkcaa FOREIGN KEY (dossier_id) REFERENCES dossiers_inscriptions(id)
);

CREATE TABLE IF NOT EXISTS dossiers (
    date_cloture date,
    date_ouverture date NOT NULL,
    apprenant_id uuid NOT NULL,
    centre_id uuid NOT NULL,
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    observation text,
    statut character varying(255) NOT NULL,
    CONSTRAINT dossiers_statut_check CHECK (((statut)::text = ANY ((ARRAY['OUVERT'::character varying, 'COMPLET'::character varying, 'CLOTURE'::character varying])::text[]))),
    CONSTRAINT dossiers_apprenant_id_key UNIQUE (apprenant_id),
    CONSTRAINT dossiers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS dossiers_concours (
    date_ajout date NOT NULL,
    montant_total numeric(38,2) NOT NULL,
    centre_id uuid NOT NULL,
    concours_id uuid NOT NULL,
    dossier_id uuid NOT NULL,
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    CONSTRAINT dossiers_concours_dossier_id_concours_id_key UNIQUE (dossier_id, concours_id),
    CONSTRAINT dossiers_concours_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS formations (
    id uuid NOT NULL,
    nom character varying(255) NOT NULL,
    CONSTRAINT formations_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS formations_matieres (
    formation_id uuid NOT NULL,
    matiere_id uuid NOT NULL,
    CONSTRAINT formations_matieres_pkey PRIMARY KEY (formation_id, matiere_id),
    CONSTRAINT fkoclqhw1jtgbh22vmykdpyfega FOREIGN KEY (formation_id) REFERENCES formations(id)
);

CREATE TABLE IF NOT EXISTS inscriptions_phases_formations (
    date_debut date NOT NULL,
    date_fin date,
    created_at timestamp(6) with time zone NOT NULL,
    updated_at timestamp(6) with time zone NOT NULL,
    apprenant_id uuid NOT NULL,
    contrat_id uuid,
    formation_id uuid NOT NULL,
    formation_precedente_id uuid,
    id uuid NOT NULL,
    phase_id uuid NOT NULL,
    statut character varying(30) NOT NULL,
    CONSTRAINT inscriptions_phases_formations_pkey PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_ipf_apprenant_id ON inscriptions_phases_formations USING btree (apprenant_id);
CREATE INDEX IF NOT EXISTS idx_ipf_contrat_id ON inscriptions_phases_formations USING btree (contrat_id);
CREATE INDEX IF NOT EXISTS idx_ipf_phase_formation ON inscriptions_phases_formations USING btree (phase_id, formation_id);

CREATE TABLE IF NOT EXISTS localisations_centre (
    date_debut_validite timestamp(6) without time zone NOT NULL,
    date_fin_validite timestamp(6) without time zone,
    centre_id uuid NOT NULL,
    id uuid NOT NULL,
    adresse character varying(255) NOT NULL,
    ville character varying(255) NOT NULL,
    CONSTRAINT localisations_centre_pkey PRIMARY KEY (id),
    CONSTRAINT fk7fbyhy96jb5mvy6prjcxmmpmx FOREIGN KEY (centre_id) REFERENCES centres(id)
);

CREATE TABLE IF NOT EXISTS matieres (
    id uuid NOT NULL,
    couleur character varying(255),
    nom character varying(255) NOT NULL,
    CONSTRAINT matieres_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS motifs (
    actif boolean NOT NULL,
    id uuid NOT NULL,
    nom character varying(255) NOT NULL,
    type character varying(255) NOT NULL,
    CONSTRAINT motifs_type_check CHECK (((type)::text = ANY ((ARRAY['ENTREE'::character varying, 'SORTIE'::character varying])::text[]))),
    CONSTRAINT motifs_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS mouvements_financiers (
    date date NOT NULL,
    montant numeric(38,2) NOT NULL,
    apprenant_id uuid,
    bilan_journalier_id uuid,
    centre_id uuid,
    dossier_concours_id uuid,
    formation_id uuid,
    id uuid NOT NULL,
    motif_id uuid NOT NULL,
    saisi_par_utilisateur_id uuid NOT NULL,
    session_id uuid NOT NULL,
    type_mouvement character varying(31) NOT NULL,
    ordonnateur character varying(255),
    statut character varying(255) NOT NULL,
    CONSTRAINT mouvements_financiers_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'VALIDE'::character varying, 'REJETE'::character varying])::text[]))),
    CONSTRAINT mouvements_financiers_type_mouvement_check CHECK (((type_mouvement)::text = ANY ((ARRAY['ENTREE'::character varying, 'SORTIE'::character varying])::text[]))),
    CONSTRAINT mouvements_financiers_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS phases (
    date_debut date,
    date_fin date,
    id uuid NOT NULL,
    code character varying(255) NOT NULL,
    libelle character varying(255) NOT NULL,
    CONSTRAINT phases_code_key UNIQUE (code),
    CONSTRAINT phases_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS pieces_dossier (
    date_validation date,
    quantite integer NOT NULL,
    dossier_concours_id uuid NOT NULL,
    id uuid NOT NULL,
    piece_requise_id uuid NOT NULL,
    statut character varying(255) NOT NULL,
    CONSTRAINT pieces_dossier_statut_check CHECK (((statut)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'VALIDEE'::character varying])::text[]))),
    CONSTRAINT pieces_dossier_dossier_concours_id_piece_requise_id_key UNIQUE (dossier_concours_id, piece_requise_id),
    CONSTRAINT pieces_dossier_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS pieces_requises (
    actif boolean NOT NULL,
    montant numeric(38,2) NOT NULL,
    id uuid NOT NULL,
    nom character varying(255) NOT NULL,
    CONSTRAINT pieces_requises_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS progressions (
    numero_cours integer NOT NULL,
    semaine integer NOT NULL,
    formation_id uuid NOT NULL,
    id uuid NOT NULL,
    matiere_id uuid NOT NULL,
    phase_id uuid NOT NULL,
    session_id uuid NOT NULL,
    contenu text NOT NULL,
    exercices text,
    theme character varying(255) NOT NULL,
    CONSTRAINT progressions_formation_id_session_id_phase_id_matiere_id_se_key UNIQUE (formation_id, session_id, phase_id, matiere_id, semaine, numero_cours),
    CONSTRAINT progressions_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS rattachements_centre (
    centre_id uuid NOT NULL,
    id uuid NOT NULL,
    session_id uuid NOT NULL,
    utilisateur_id uuid NOT NULL,
    CONSTRAINT rattachements_centre_pkey PRIMARY KEY (id),
    CONSTRAINT rattachements_centre_utilisateur_id_session_id_key UNIQUE (utilisateur_id, session_id)
);

CREATE TABLE IF NOT EXISTS salles (
    centre_id uuid NOT NULL,
    formation_id uuid NOT NULL,
    id uuid NOT NULL,
    phase_id uuid NOT NULL,
    session_id uuid NOT NULL,
    nom character varying(255) NOT NULL,
    CONSTRAINT salles_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS sessions_academiques (
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    id uuid NOT NULL,
    annee character varying(255) NOT NULL,
    statut character varying(255) NOT NULL,
    CONSTRAINT sessions_academiques_statut_check CHECK (((statut)::text = ANY ((ARRAY['PLANIFIEE'::character varying, 'EN_COURS'::character varying, 'CLOTUREE'::character varying])::text[]))),
    CONSTRAINT sessions_academiques_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS validations_mouvements (
    date timestamp(6) without time zone NOT NULL,
    id uuid NOT NULL,
    mouvement_financier_id uuid NOT NULL,
    validateur_utilisateur_id uuid NOT NULL,
    decision character varying(255) NOT NULL,
    CONSTRAINT validations_mouvements_decision_check CHECK (((decision)::text = ANY ((ARRAY['EN_ATTENTE'::character varying, 'VALIDE'::character varying, 'REJETE'::character varying])::text[]))),
    CONSTRAINT validations_mouvements_pkey PRIMARY KEY (id)
);

