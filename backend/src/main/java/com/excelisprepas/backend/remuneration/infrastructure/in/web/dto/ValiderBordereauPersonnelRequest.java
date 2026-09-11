package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

public record ValiderBordereauPersonnelRequest(
        @NotNull LocalDate datePaiement,
        @NotBlank String reference,
        String intitule,
        @NotEmpty List<LigneSaisiePaieRequest> lignes,
        String saisiPar
) {
}
