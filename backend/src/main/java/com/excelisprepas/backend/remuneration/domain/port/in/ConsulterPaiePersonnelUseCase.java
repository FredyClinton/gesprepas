package com.excelisprepas.backend.remuneration.domain.port.in;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaiePersonnel;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConsulterPaiePersonnelUseCase {
    Optional<BordereauPaiePersonnel> recupererBordereau(UUID bordereauId);
    List<BordereauPaiePersonnel> listerParSession(UUID sessionId);
}
