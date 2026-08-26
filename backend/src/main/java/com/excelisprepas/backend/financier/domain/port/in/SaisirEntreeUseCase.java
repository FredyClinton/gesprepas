package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.Entree;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface SaisirEntreeUseCase {
    Entree saisirEntree(UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                        UUID saisiParUtilisateurId, UUID centreId, UUID apprenantId);
}