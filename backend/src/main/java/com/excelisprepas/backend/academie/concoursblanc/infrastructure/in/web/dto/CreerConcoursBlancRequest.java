package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreerConcoursBlancRequest(
        @NotNull UUID sessionId,
        @NotBlank String titre,
        @Positive int numero,
        @NotNull LocalDate dateEpreuve,
        @NotNull Jour jour,
        @Positive int semaine,
        int seanceDebut,
        int seanceFin,
        Boolean tousLesCentres,
        List<UUID> centreIds,
        List<EpreuveInput> epreuves
) {
    public record EpreuveInput(
            @NotNull UUID formationId,
            @NotNull UUID matiereId,
            String intitule,
            int dureeMinutes,
            BigDecimal noteMax,
            BigDecimal coefficient
    ) {}
}

