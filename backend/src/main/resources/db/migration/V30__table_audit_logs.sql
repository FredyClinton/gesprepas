CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Acteur de l'action
    utilisateur_id UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
    utilisateur_nom VARCHAR(255),
    utilisateur_email VARCHAR(255),
    utilisateur_role VARCHAR(100),
    
    -- Centre concerné
    centre_id UUID REFERENCES centres(id) ON DELETE SET NULL,
    centre_nom VARCHAR(255),
    
    -- Métier & Action
    module VARCHAR(50) NOT NULL,
    type_action VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    
    -- Entité ciblée
    entite_type VARCHAR(100),
    entite_id VARCHAR(255),
    
    -- Statut & Contexte
    statut VARCHAR(20) NOT NULL DEFAULT 'SUCCES',
    details JSONB,
    adresse_ip VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_centre_id ON audit_logs(centre_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
CREATE INDEX IF NOT EXISTS idx_audit_logs_utilisateur_id ON audit_logs(utilisateur_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entite ON audit_logs(entite_type, entite_id);
