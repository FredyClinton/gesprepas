package com.excelisprepas.backend.dossier.domain.port.out;

import com.excelisprepas.backend.dossier.domain.model.Dossier;

import java.util.Optional;
import java.util.UUID;

public interface DossierRepositoryPort {
    Dossier save(Dossier dossier);

    Optional<Dossier> findById(UUID id);

    Optional<Dossier> findByApprenantId(UUID apprenantId);

    boolean existsByApprenantId(UUID apprenantId);
}