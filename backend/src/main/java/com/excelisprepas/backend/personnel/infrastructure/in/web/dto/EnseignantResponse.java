package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record EnseignantResponse(
        UUID id,
        String nom,
        String prenom,
        String matricule,
        BigDecimal coutParSeance
) {
}
