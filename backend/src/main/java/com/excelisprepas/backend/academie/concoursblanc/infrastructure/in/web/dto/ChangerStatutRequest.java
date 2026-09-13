package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.StatutConcoursBlanc;
import jakarta.validation.constraints.NotNull;

public record ChangerStatutRequest(
        @NotNull StatutConcoursBlanc statut
) {}

