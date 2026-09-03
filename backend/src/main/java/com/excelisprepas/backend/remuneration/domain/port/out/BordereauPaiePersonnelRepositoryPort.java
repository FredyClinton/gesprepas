package com.excelisprepas.backend.remuneration.domain.port.out;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaiePersonnel;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BordereauPaiePersonnelRepositoryPort {
    BordereauPaiePersonnel save(BordereauPaiePersonnel bordereau);
    Optional<BordereauPaiePersonnel> findById(UUID id);
    List<BordereauPaiePersonnel> findBySessionId(UUID sessionId);
}
