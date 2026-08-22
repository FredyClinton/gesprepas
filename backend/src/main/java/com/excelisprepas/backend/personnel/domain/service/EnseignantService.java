package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.personnel.domain.exception.MatriculeDejaUtiliseException;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.in.CreerEnseignantUseCase;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;

import java.math.BigDecimal;
import java.util.UUID;

public class EnseignantService implements CreerEnseignantUseCase {
    private final EnseignantRepositoryPort repository;

    public EnseignantService(EnseignantRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Enseignant creerEnseignant(String nom, String prenom, String matricule, BigDecimal coutParSeance) {
        if (repository.existsByMatricule(matricule)) {
            throw new MatriculeDejaUtiliseException(matricule);
        }

        Enseignant enseignant = new Enseignant(UUID.randomUUID(), nom, prenom, matricule, coutParSeance);
        return repository.save(enseignant);
    }
}
