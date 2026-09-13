package com.excelisprepas.backend.academie.etablissement.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.etablissement.domain.model.Etablissement;

import java.util.UUID;

public record EtablissementResponse(
        UUID id,
        String nom,
        String ville
) {
    public static EtablissementResponse fromDomain(Etablissement etablissement) {
        if (etablissement == null) return null;
        return new EtablissementResponse(
                etablissement.getId(),
                etablissement.getNom(),
                etablissement.getVille()
        );
    }
}

