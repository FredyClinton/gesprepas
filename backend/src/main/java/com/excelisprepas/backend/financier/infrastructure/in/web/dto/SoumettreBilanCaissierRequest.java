package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.UUID;

public record SoumettreBilanCaissierRequest(
        @NotNull UUID centreId,
        @NotNull UUID sessionId,
        @NotNull LocalDate date,
        @NotNull UUID caissierUtilisateurId
) {
}
