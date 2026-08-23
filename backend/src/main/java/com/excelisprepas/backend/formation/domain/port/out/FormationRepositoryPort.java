package com.excelisprepas.backend.formation.domain.port.out;

import com.excelisprepas.backend.formation.domain.model.Formation;

import java.util.Optional;
import java.util.UUID;

public interface FormationRepositoryPort {
    Formation save(Formation formation);

    Optional<Formation> findById(UUID id);
}