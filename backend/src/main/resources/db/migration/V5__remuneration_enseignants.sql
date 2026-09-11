-- Table Historique des Tarifs
CREATE TABLE IF NOT EXISTS historique_tarifs_enseignant (
    id UUID PRIMARY KEY,
    enseignant_id UUID NOT NULL,
    session_id UUID NOT NULL,
    semaine_debut INT NOT NULL,
    semaine_fin INT NOT NULL,
    cout_par_seance DECIMAL(12,2) NOT NULL,
    date_modification TIMESTAMP NOT NULL,
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE
);

-- Ajout des champs de paiement dans affectations
ALTER TABLE affectations ADD COLUMN IF NOT EXISTS statut_paiement VARCHAR(50) DEFAULT 'NON_PAYEE' NOT NULL;
ALTER TABLE affectations ADD COLUMN IF NOT EXISTS cout_applique DECIMAL(12,2);
ALTER TABLE affectations ADD COLUMN IF NOT EXISTS fiche_paie_id UUID;

-- Table Bordereaux de Paie
CREATE TABLE IF NOT EXISTS bordereaux_paie (
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
CREATE TABLE IF NOT EXISTS fiches_paie_enseignant (
    id UUID PRIMARY KEY,
    bordereau_paie_id UUID NOT NULL,
    enseignant_id UUID NOT NULL,
    nombre_seances INT NOT NULL,
    montant_total DECIMAL(12,2) NOT NULL,
    FOREIGN KEY (bordereau_paie_id) REFERENCES bordereaux_paie(id) ON DELETE CASCADE,
    FOREIGN KEY (enseignant_id) REFERENCES enseignants(id) ON DELETE CASCADE
);
