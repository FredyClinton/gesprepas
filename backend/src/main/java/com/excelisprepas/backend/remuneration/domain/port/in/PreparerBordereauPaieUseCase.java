package com.excelisprepas.backend.remuneration.domain.port.in;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;

import java.time.LocalDate;
import java.util.UUID;

public interface PreparerBordereauPaieUseCase {
    BordereauPaie preparerDecompte(UUID sessionId, LocalDate datePaiement, String saisiPar);
}
