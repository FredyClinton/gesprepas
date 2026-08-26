package com.excelisprepas.backend.financier.infrastructure.in.web.dto;

import com.excelisprepas.backend.financier.domain.model.TypeMotif;

import java.util.UUID;

public record MotifResponse(UUID id, String nom, TypeMotif type, boolean actif) {
}