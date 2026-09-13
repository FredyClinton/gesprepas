package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ApprenantResponse(
        UUID id, String nom, String prenom, LocalDate dateNaissance,
        LocalDate dateInscription, UUID centreId, UUID sessionId,
        String contactApprenant, String nomParent, String contactParent,
        String etablissementOrigine, UUID formationId, BigDecimal montantContrat,
        Boolean preInscrit, String referenceRecu
) {
}