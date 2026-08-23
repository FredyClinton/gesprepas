package com.excelisprepas.backend.centre.infrastructure.in.web.dto;

import com.excelisprepas.backend.centre.domain.model.StatutCentre;

import java.util.UUID;

public record CentreResponse(
        UUID id,
        String nom,
        StatutCentre statut,
        String adresseActuelle,
        String villeActuelle
) {
}