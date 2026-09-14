package com.excelisprepas.backend.session.semaine.domain.model;

import java.util.UUID;

public class SemaineSession {

    private final UUID id;
    private final UUID sessionId;
    private final int numero;

    public SemaineSession(UUID id, UUID sessionId, int numero) {
        if (sessionId == null) throw new IllegalArgumentException("La session est obligatoire");
        if (numero <= 0) throw new IllegalArgumentException("Le numéro de semaine doit être positif");
        this.id = id;
        this.sessionId = sessionId;
        this.numero = numero;
    }

    public UUID getId() { return id; }
    public UUID getSessionId() { return sessionId; }
    public int getNumero() { return numero; }
}