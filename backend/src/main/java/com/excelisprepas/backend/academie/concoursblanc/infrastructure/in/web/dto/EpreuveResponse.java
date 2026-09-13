package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.EpreuveConcoursBlanc;

import java.math.BigDecimal;
import java.util.UUID;

public record EpreuveResponse(
        UUID id,
        UUID concoursBlancId,
        UUID formationId,
        UUID matiereId,
        String intitule,
        int dureeMinutes,
        BigDecimal noteMax,
        BigDecimal coefficient,
        String contenuEvaluation,
        String consignes
) {
    public static EpreuveResponse fromDomain(EpreuveConcoursBlanc domain) {
        return new EpreuveResponse(
                domain.getId(),
                domain.getConcoursBlancId(),
                domain.getFormationId(),
                domain.getMatiereId(),
                domain.getIntitule(),
                domain.getDureeMinutes(),
                domain.getNoteMax(),
                domain.getCoefficient(),
                domain.getContenuEvaluation(),
                domain.getConsignes()
        );
    }
}

