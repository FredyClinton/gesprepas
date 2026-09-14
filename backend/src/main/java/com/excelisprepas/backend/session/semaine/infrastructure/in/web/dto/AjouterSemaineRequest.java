package com.excelisprepas.backend.session.semaine.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.util.UUID;

public record AjouterSemaineRequest(
        @NotNull UUID sessionId,
        @Positive int numero
) {}