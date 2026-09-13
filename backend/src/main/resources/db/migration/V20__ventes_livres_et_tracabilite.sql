-- Migration V20: Traçabilité des ventes de livres avec gestion des acheteurs externes et des centres

CREATE TABLE IF NOT EXISTS ventes_livres (
    id UUID PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES sessions_academiques(id),
    centre_id UUID NOT NULL REFERENCES centres(id),
    date_vente DATE NOT NULL,
    nom_acheteur VARCHAR(255) NOT NULL,
    apprenant_id UUID REFERENCES apprenants(id) ON DELETE SET NULL,
    est_externe BOOLEAN NOT NULL DEFAULT false,
    livre_id UUID NOT NULL REFERENCES livres(id),
    quantite INTEGER NOT NULL DEFAULT 1 CHECK (quantite > 0),
    prix_unitaire NUMERIC(12, 2) NOT NULL CHECK (prix_unitaire >= 0),
    montant_total NUMERIC(12, 2) NOT NULL CHECK (montant_total >= 0),
    entree_id UUID REFERENCES mouvements_financiers(id) ON DELETE SET NULL,
    saisi_par_utilisateur_id UUID NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ventes_livres_session ON ventes_livres(session_id);
CREATE INDEX IF NOT EXISTS idx_ventes_livres_centre ON ventes_livres(centre_id);
CREATE INDEX IF NOT EXISTS idx_ventes_livres_date ON ventes_livres(date_vente);
CREATE INDEX IF NOT EXISTS idx_ventes_livres_livre ON ventes_livres(livre_id);
CREATE INDEX IF NOT EXISTS idx_ventes_livres_apprenant ON ventes_livres(apprenant_id);

