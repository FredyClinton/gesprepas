package com.excelisprepas.backend.academie.affectation.infrastructure.in.web.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record ConflitHoraireResponse(
        boolean conflit,
        String message,
        UUID affectationExistanteId,
        LocalDate dateSeance,
        LocalTime heureDebut,
        LocalTime heureFin,
        UUID centreId,
        String centreNom,
        UUID formationId,
        String formationNom,
        UUID matiereId,
        String matiereNom
) {
    public static ConflitHoraireResponse sansConflit() {
        return new ConflitHoraireResponse(
                false, null, null, null, null, null, null, null, null, null, null, null);
    }

    public static ConflitHoraireResponse avecConflit(
            String message,
            UUID affectationExistanteId,
            LocalDate dateSeance,
            LocalTime heureDebut,
            LocalTime heureFin,
            UUID centreId,
            String centreNom,
            UUID formationId,
            String formationNom,
            UUID matiereId,
            String matiereNom) {
        return new ConflitHoraireResponse(
                true, message, affectationExistanteId, dateSeance, heureDebut, heureFin,
                centreId, centreNom, formationId, formationNom, matiereId, matiereNom);
    }
}

