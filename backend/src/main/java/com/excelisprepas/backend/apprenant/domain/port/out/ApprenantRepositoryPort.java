package com.excelisprepas.backend.apprenant.domain.port.out;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;

import java.util.Optional;
import java.util.UUID;

public interface ApprenantRepositoryPort {
    Apprenant save(Apprenant apprenant);

    Optional<Apprenant> findById(UUID id);

    boolean existsByCentreId(UUID centreId);
}
