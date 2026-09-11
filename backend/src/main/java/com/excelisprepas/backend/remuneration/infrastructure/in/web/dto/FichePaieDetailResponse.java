package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import com.excelisprepas.backend.remuneration.domain.model.StatutFichePaie;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record FichePaieDetailResponse(
        UUID id,
        UUID bordereauPaieId,
        String referenceBordereau,
        LocalDate datePaiement,
        UUID sessionId,
        String sessionNom,
        UUID enseignantId,
        String enseignantNom,
        String enseignantPrenom,
        String enseignantMatricule,
        String enseignantTelephone,
        String enseignantEmail,
        String departementNom,
        int nombreSeances,
        BigDecimal coutParSeance,
        BigDecimal montantTotal,
        StatutFichePaie statut,
        String saisiPar,
        List<SeanceFichePaieItemResponse> seances
) {}

