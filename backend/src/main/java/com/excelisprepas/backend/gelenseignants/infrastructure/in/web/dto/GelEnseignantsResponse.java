package com.excelisprepas.backend.gelenseignants.infrastructure.in.web.dto;

import java.time.Instant;

public record GelEnseignantsResponse(boolean actif, Instant dateFin, boolean effectif) {
}
