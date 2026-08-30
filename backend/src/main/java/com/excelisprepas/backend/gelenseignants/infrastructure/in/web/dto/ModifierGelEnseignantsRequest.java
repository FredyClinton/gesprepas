package com.excelisprepas.backend.gelenseignants.infrastructure.in.web.dto;

import java.time.Instant;

public record ModifierGelEnseignantsRequest(boolean actif, Instant dateFin) {
}
