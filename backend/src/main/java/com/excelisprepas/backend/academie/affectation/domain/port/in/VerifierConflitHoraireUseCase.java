package com.excelisprepas.backend.academie.affectation.domain.port.in;

import com.excelisprepas.backend.academie.affectation.infrastructure.in.web.dto.ConflitHoraireResponse;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public interface VerifierConflitHoraireUseCase {
    ConflitHoraireResponse verifierConflit(UUID enseignantId, LocalDate dateSeance, LocalTime debut, LocalTime fin, UUID affectationCouranteId);
}

