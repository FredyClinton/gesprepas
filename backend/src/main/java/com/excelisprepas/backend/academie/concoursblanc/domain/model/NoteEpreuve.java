package com.excelisprepas.backend.academie.concoursblanc.domain.model;

import java.math.BigDecimal;
import java.util.UUID;

public record NoteEpreuve(
        UUID epreuveId,
        BigDecimal note,
        StatutNote statut
) {}

