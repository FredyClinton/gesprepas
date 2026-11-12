package com.excelisprepas.backend.dossier.infrastructure.in.web.dto;

import com.excelisprepas.backend.shared.infrastructure.in.web.dto.PageResponse;

/** Page de dossiers + compteurs par statut du périmètre session/centre. */
public record RechercheDossiersResponse(
        PageResponse<LigneDossierResponse> page,
        long total,
        long ouverts,
        long complets,
        long clotures
) {
}
