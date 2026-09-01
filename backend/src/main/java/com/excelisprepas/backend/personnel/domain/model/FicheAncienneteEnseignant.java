package com.excelisprepas.backend.personnel.domain.model;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record FicheAncienneteEnseignant(
        UUID enseignantId,
        String nom,
        String prenom,
        String matricule,
        StatutEnseignant statut,
        LocalDate dateRecrutement,
        int ancienneteAnnees,
        int ancienneteMois,
        int nombreSessionsActives,
        List<ResumeSessionEnseignant> historiqueSessions
) {
}
