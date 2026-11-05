package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;

import java.time.LocalDate;
import java.util.UUID;

public interface ValiderBilanControleurUseCase {
    BilanJournalier validerBilanControleur(UUID bilanId, UUID validateurUtilisateurId);
    BilanJournalier validerBilanControleur(UUID centreId, UUID sessionId, LocalDate date, UUID validateurUtilisateurId);
}