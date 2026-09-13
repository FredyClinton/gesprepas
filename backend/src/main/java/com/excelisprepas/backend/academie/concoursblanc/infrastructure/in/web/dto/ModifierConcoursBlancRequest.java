package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ModifierConcoursBlancRequest(
        @NotBlank String titre,
        @Positive int numero,
        @NotNull LocalDate dateEpreuve,
        @NotNull Jour jour,
        @Positive int semaine,
        int seanceDebut,
        int seanceFin,
        Boolean tousLesCentres,
        List<UUID> centreIds,
        List<CreerConcoursBlancRequest.EpreuveInput> epreuves
) {}
