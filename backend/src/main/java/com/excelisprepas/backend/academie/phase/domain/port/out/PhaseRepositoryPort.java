package com.excelisprepas.backend.academie.phase.domain.port.out;

import com.excelisprepas.backend.academie.phase.domain.model.Phase;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PhaseRepositoryPort {
    Phase save(Phase phase);
    Optional<Phase> findById(UUID id);
    Optional<Phase> findByCode(String code);
    List<Phase> findAll();
    void deleteById(UUID id);
}

