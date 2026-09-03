package com.excelisprepas.backend.remuneration.domain.port.in;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaiePersonnel;

import java.time.LocalDate;
import java.util.UUID;

public interface PreparerBordereauPersonnelUseCase {
    BordereauPaiePersonnel preparerSimulation(UUID sessionId, LocalDate datePaiement, String intitule, String saisiPar);
}
