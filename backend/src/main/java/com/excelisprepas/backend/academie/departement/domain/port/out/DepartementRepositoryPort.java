package com.excelisprepas.backend.academie.departement.domain.port.out;

import com.excelisprepas.backend.academie.departement.domain.model.Departement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DepartementRepositoryPort {
    Departement save(Departement departement);

    Optional<Departement> findById(UUID id);

    List<Departement> findAll();

    void deleteById(UUID id);

    boolean existsByMatiereId(UUID matiereId);

    Optional<Departement> findByMatiereId(UUID matiereId);
}