package com.excelisprepas.backend.session.domain.port.in;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;

import java.time.LocalDate;
import java.util.UUID;

public interface ModifierSessionUseCase {
    SessionAcademique modifierSession(UUID id, String annee, LocalDate dateDebut, LocalDate dateFin);
}

