package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import com.excelisprepas.backend.remuneration.domain.model.StatutFichePaie;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record FichePaieEnseignantDetailResponse(
        UUID id,
        UUID enseignantId,
        String enseignantNom,
        String enseignantPrenom,
        String enseignantMatricule,
        String departementNom,
        int nombreSeances,
        BigDecimal coutParSeance,
        BigDecimal montantTotal,
        StatutFichePaie statut,
        List<UUID> affectationIds,
        List<SeanceFichePaieItemResponse> seances
) {}

