package com.excelisprepas.backend.remuneration.domain.port.out;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BordereauPaieRepositoryPort {
    BordereauPaie save(BordereauPaie bordereau);
    Optional<BordereauPaie> findById(UUID id);
    List<BordereauPaie> findBySessionId(UUID sessionId);
}
