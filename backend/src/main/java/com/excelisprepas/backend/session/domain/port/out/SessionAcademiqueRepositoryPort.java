package com.excelisprepas.backend.session.domain.port.out;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SessionAcademiqueRepositoryPort {
    SessionAcademique save(SessionAcademique session);

    Optional<SessionAcademique> findById(UUID id);

    List<SessionAcademique> findAll();

    void deleteById(UUID id);

    Optional<SessionAcademique> findEnCours();
}