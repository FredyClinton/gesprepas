package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.ResultatCandidat;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.StatutNote;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public record ResultatCandidatResponse(
        UUID id,
        UUID concoursBlancId,
        UUID formationId,
        UUID centreId,
        UUID apprenantId,
        String nomComplet,
        String etablissementOrigine,
        boolean horsListe,
        List<NoteDetailResponse> notes,
        BigDecimal totalPondere,
        BigDecimal moyennePonderee,
        Integer rang,
        Integer rangCentre,
        Integer deltaRang
) {
    public record NoteDetailResponse(
            UUID epreuveId,
            BigDecimal note,
            StatutNote statut
    ) {}

    public static ResultatCandidatResponse fromDomain(ResultatCandidat domain) {
        List<NoteDetailResponse> notes = domain.getNotes() != null
                ? domain.getNotes().stream()
                .map(n -> new NoteDetailResponse(n.epreuveId(), n.note(), n.statut()))
                .collect(Collectors.toList())
                : List.of();
        return new ResultatCandidatResponse(
                domain.getId(),
                domain.getConcoursBlancId(),
                domain.getFormationId(),
                domain.getCentreId(),
                domain.getApprenantId(),
                domain.getNomComplet(),
                domain.getEtablissementOrigine(),
                domain.isHorsListe(),
                notes,
                domain.getTotalPondere(),
                domain.getMoyennePonderee(),
                domain.getRang(),
                domain.getRangCentre(),
                domain.getDeltaRang()
        );
    }
}

