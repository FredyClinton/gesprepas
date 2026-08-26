package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record PieceRequiseResponse(UUID id, String nom, BigDecimal montant, boolean actif) {
}