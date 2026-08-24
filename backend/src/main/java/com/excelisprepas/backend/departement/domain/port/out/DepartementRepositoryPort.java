package com.excelisprepas.backend.departement.domain.port.out;

import com.excelisprepas.backend.departement.domain.model.Departement;

import java.util.Optional;
import java.util.UUID;

public interface DepartementRepositoryPort {
    Departement save(Departement departement);

    Optional<Departement> findById(UUID id);
}