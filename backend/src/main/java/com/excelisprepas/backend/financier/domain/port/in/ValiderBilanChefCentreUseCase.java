package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;

import java.time.LocalDate;
import java.util.UUID;

public interface ValiderBilanChefCentreUseCase {
    BilanJournalier validerBilanChefCentre(UUID centreId, UUID sessionId, LocalDate date, UUID validateurUtilisateurId);
}