-- Migration V22 : table des refresh tokens (authentification JWT)
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY,
    utilisateur_id UUID NOT NULL REFERENCES utilisateurs(id),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    date_expiration TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    date_revocation TIMESTAMP WITHOUT TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_utilisateur_id ON refresh_tokens(utilisateur_id);
