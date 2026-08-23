package com.excelisprepas.backend.matiere.domain.service;

import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.in.CreerMatiereUseCase;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;

import java.util.UUID;

public class MatiereService implements CreerMatiereUseCase {

    private final MatiereRepositoryPort repository;

    public MatiereService(MatiereRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Matiere creerMatiere(String nom) {
        Matiere matiere = new Matiere(UUID.randomUUID(), nom);
        return repository.save(matiere);
    }
}
