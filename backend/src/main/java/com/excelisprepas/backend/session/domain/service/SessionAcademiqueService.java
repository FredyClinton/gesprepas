package com.excelisprepas.backend.session.domain.service;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.in.CreerSessionAcademiqueUseCase;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;

import java.time.LocalDate;
import java.util.UUID;

public class SessionAcademiqueService implements CreerSessionAcademiqueUseCase {

    private final SessionAcademiqueRepositoryPort repository;

    public SessionAcademiqueService(SessionAcademiqueRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public SessionAcademique creerSession(String annee, LocalDate dateDebut, LocalDate dateFin) {
        SessionAcademique session = new SessionAcademique(UUID.randomUUID(), annee, dateDebut, dateFin);
        return repository.save(session);
    }
}
