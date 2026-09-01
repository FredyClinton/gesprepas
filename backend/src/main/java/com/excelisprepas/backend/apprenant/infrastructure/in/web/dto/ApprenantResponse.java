package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ApprenantResponse(
        UUID id, String nom, String prenom, LocalDate dateNaissance,
        LocalDate dateInscription, UUID centreId,
        String contactApprenant, String nomParent, String contactParent
) {
}