-- Table Historique des Tarifs
CREATE TABLE historique_tarifs_enseignant (
    id UUID PRIMARY KEY,
    enseignant_id UUID NOT NULL,
    session_id UUID NOT NULL,
    semaine_debut INT NOT NULL,
    semaine_fin INT NOT NULL,
    cout_par_seance DECIMAL(12,2) NOT NULL,
    date_modification TIMESTAMP NOT NULL,
    FOREIGN KEY (enseignant_id) REFERENCES enseignant(id) ON DELETE CASCADE
);

-- Ajout des champs de paiement dans affectation
ALTER TABLE affectation ADD COLUMN statut_paiement VARCHAR(50) DEFAULT 'NON_PAYEE' NOT NULL;
ALTER TABLE affectation ADD COLUMN cout_applique DECIMAL(12,2);
ALTER TABLE affectation ADD COLUMN fiche_paie_id UUID;

-- Table Bordereaux de Paie
CREATE TABLE bordereaux_paie (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL,
    reference VARCHAR(255) NOT NULL UNIQUE,
    date_paiement DATE NOT NULL,
    nombre_total_enseignants INT NOT NULL,
    nombre_total_seances INT NOT NULL,
    montant_total_global DECIMAL(12,2) NOT NULL,
    sortie_id UUID NOT NULL,
    saisi_par VARCHAR(255) NOT NULL
);

-- Table Fiches de Paie
CREATE TABLE fiches_paie_enseignant (
    id UUID PRIMARY KEY,
    bordereau_paie_id UUID NOT NULL,
    enseignant_id UUID NOT NULL,
    nombre_seances INT NOT NULL,
    montant_total DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (bordereau_paie_id) REFERENCES bordereaux_paie(id) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_id) REFERENCES enseignant(id) ON DELETE CASCADE
);
