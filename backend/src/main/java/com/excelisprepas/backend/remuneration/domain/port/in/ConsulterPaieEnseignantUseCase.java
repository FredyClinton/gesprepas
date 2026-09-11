package com.excelisprepas.backend.remuneration.domain.port.in;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConsulterPaieEnseignantUseCase {
    List<BordereauPaie> listerBordereauxParSession(UUID sessionId);
    Optional<BordereauPaie> recupererBordereau(UUID bordereauId);
}

