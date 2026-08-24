package com.excelisprepas.backend.matiere.domain.port.out;

import com.excelisprepas.backend.matiere.domain.model.Matiere;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MatiereRepositoryPort {
    Matiere save(Matiere matiere);

    Optional<Matiere> findById(UUID id);

    List<Matiere> findAll();

    void deleteById(UUID id);
}