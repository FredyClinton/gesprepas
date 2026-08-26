package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PaiementResponse(
        UUID id, BigDecimal montant, LocalDate date, StatutMouvement statut, UUID dossierConcoursId
) {
}