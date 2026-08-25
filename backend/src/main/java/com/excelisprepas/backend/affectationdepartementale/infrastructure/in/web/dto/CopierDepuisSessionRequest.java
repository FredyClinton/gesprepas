package com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.Set;
import java.util.UUID;

public record CopierDepuisSessionRequest(
        @NotNull(message = "Le département est obligatoire") UUID departementId,
        @NotNull(message = "La session source est obligatoire") UUID sessionSourceId,
        @NotNull(message = "La session cible est obligatoire") UUID sessionCibleId,
        @NotEmpty(message = "Au moins un enseignant doit être sélectionné") Set<UUID> enseignantIdsSelectionnes
) {
}