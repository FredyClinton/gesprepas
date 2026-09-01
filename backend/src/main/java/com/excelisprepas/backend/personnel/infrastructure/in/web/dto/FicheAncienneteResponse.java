package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record FicheAncienneteResponse(
        UUID enseignantId,
        String nom,
        String prenom,
        String matricule,
        StatutEnseignant statut,
        LocalDate dateRecrutement,
        int ancienneteAnnees,
        int ancienneteMois,
        int nombreSessionsActives,
        List<ResumeSessionResponse> historiqueSessions
) {
}
