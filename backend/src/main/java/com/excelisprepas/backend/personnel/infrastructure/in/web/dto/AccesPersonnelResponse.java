package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;
import com.excelisprepas.backend.personnel.domain.model.StatutAcces;

import java.time.LocalDateTime;
import java.util.UUID;

public record AccesPersonnelResponse(
        UUID id,
        UUID personnelId,
        UUID sessionId,
        UUID phaseId,
        StatutAcces statut,
        String motif,
        LocalDateTime dateModification
) {
    public static AccesPersonnelResponse fromDomain(AccesPersonnel domain) {
        return new AccesPersonnelResponse(
                domain.getId(),
                domain.getPersonnelId(),
                domain.getSessionId(),
                domain.getPhaseId(),
                domain.getStatut(),
                domain.getMotif(),
                domain.getDateModification()
        );
    }
}
