package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.Sortie;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface SaisirSortieUseCase {
    Sortie saisirSortie(UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                        UUID saisiParUtilisateurId, UUID centreId, String ordonnateur);
}