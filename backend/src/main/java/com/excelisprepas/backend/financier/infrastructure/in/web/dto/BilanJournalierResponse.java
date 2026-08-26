package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.StatutBilan;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record BilanJournalierResponse(
        UUID id, UUID centreId, UUID sessionId, LocalDate date, StatutBilan statut,
        LocalDateTime dateValidationChefCentre, UUID validateurChefCentreId,
        LocalDateTime dateValidationControleur, UUID validateurControleurId,
        BigDecimal totalEntrees, BigDecimal totalSorties, BigDecimal netAVerser,
        Integer effectifNouveauxEleves, Integer effectifTotalCentre
) {
}