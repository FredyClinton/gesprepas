package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ApprenantResponse(
        UUID id, String nom, String prenom, LocalDate dateNaissance,
        LocalDate dateInscription, BigDecimal montantContrat,
        LocalDate dateDefinitionContrat, UUID centreId, UUID formationId
) {
}