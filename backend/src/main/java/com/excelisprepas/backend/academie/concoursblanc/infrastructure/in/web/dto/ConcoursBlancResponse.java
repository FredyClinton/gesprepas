package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.ConcoursBlanc;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.StatutConcoursBlanc;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record ConcoursBlancResponse(
        UUID id,
        UUID sessionId,
        String titre,
        int numero,
        LocalDate dateEpreuve,
        Jour jour,
        int semaine,
        StatutConcoursBlanc statut,
        int seanceDebut,
        int seanceFin,
        boolean tousLesCentres,
        List<UUID> centreIds,
        boolean saisieNotesBloqueeCentre,
        List<EpreuveResponse> epreuves
) {
    public static ConcoursBlancResponse fromDomain(ConcoursBlanc domain) {
        List<EpreuveResponse> eps = domain.getEpreuves() != null
                ? domain.getEpreuves().stream().map(EpreuveResponse::fromDomain).collect(Collectors.toList())
                : List.of();
        return new ConcoursBlancResponse(
                domain.getId(),
                domain.getSessionId(),
                domain.getTitre(),
                domain.getNumero(),
                domain.getDateEpreuve(),
                domain.getJour(),
                domain.getSemaine(),
                domain.getStatut(),
                domain.getSeanceDebut(),
                domain.getSeanceFin(),
                domain.isTousLesCentres(),
                domain.getCentreIds(),
                domain.isSaisieNotesBloqueeCentre(),
                eps
        );
    }
}

