package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;

import java.util.UUID;

public interface ValiderBilanControleurUseCase {
    BilanJournalier validerBilanControleur(UUID bilanId, UUID validateurUtilisateurId);
}