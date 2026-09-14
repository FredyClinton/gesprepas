CREATE TABLE IF NOT EXISTS semaines_sessions (
	id UUID PRIMARY KEY,
	session_id UUID NOT NULL REFERENCES sessions_academiques(id),
	numero INTEGER NOT NULL CHECK (numero > 0),
	CONSTRAINT uq_semaines_sessions_session_numero UNIQUE (session_id, numero)
);
