package com.excelisprepas.backend.personnel.domain.port.out;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EnseignantRepositoryPort {

    Enseignant save(Enseignant enseignant);

    Optional<Enseignant> findById(UUID id);

    Optional<Enseignant> findByMatricule(String matricule);

    boolean existsByMatricule(String matricule);

    List<Enseignant> findAll();

    void deleteById(UUID id);
}