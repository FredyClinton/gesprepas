package com.excelisprepas.backend.session.semaine.domain.service;

import com.excelisprepas.backend.session.semaine.domain.model.SemaineSession;
import com.excelisprepas.backend.session.semaine.domain.port.in.AjouterSemaineUseCase;
import com.excelisprepas.backend.session.semaine.domain.port.in.ListerSemainesUseCase;
import com.excelisprepas.backend.session.semaine.domain.port.out.SemaineSessionRepositoryPort;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

public class SemaineSessionService implements ListerSemainesUseCase, AjouterSemaineUseCase {

    private final SemaineSessionRepositoryPort repository;

    public SemaineSessionService(SemaineSessionRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public List<SemaineSession> listerSemaines(UUID sessionId) {
        return repository.findBySessionId(sessionId).stream()
                .sorted(Comparator.comparingInt(SemaineSession::getNumero))
                .toList();
    }

    @Override
    public SemaineSession ajouterSemaine(UUID sessionId, int numero) {
        return repository.findBySessionIdAndNumero(sessionId, numero)
                .orElseGet(() -> repository.save(new SemaineSession(UUID.randomUUID(), sessionId, numero)));
    }
}