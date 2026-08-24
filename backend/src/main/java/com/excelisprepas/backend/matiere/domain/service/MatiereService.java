package com.excelisprepas.backend.matiere.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.matiere.domain.exception.MatiereUtiliseeException;
import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.in.*;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;

import java.util.List;
import java.util.UUID;

public class MatiereService implements CreerMatiereUseCase, RecupererMatiereUseCase,
        ListerMatieresUseCase, RenommerMatiereUseCase, SupprimerMatiereUseCase {

    private final MatiereRepositoryPort repository;
    private final DepartementRepositoryPort departementRepository;
    private final AffectationRepositoryPort affectationRepository;
    private final ProgressionRepositoryPort progressionRepository;

    public MatiereService(MatiereRepositoryPort repository,
                          DepartementRepositoryPort departementRepository,
                          AffectationRepositoryPort affectationRepository,
                          ProgressionRepositoryPort progressionRepository) {
        this.repository = repository;
        this.departementRepository = departementRepository;
        this.affectationRepository = affectationRepository;
        this.progressionRepository = progressionRepository;
    }

    @Override
    public Matiere creerMatiere(String nom) {
        Matiere matiere = new Matiere(UUID.randomUUID(), nom);
        return repository.save(matiere);
    }

    @Override
    public Matiere recupererMatiere(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new MatiereIntrouvableException(id));
    }

    @Override
    public List<Matiere> listerMatieres() {
        return repository.findAll();
    }

    @Override
    public Matiere renommerMatiere(UUID id, String nouveauNom) {
        Matiere matiere = recupererMatiere(id);
        matiere.renommer(nouveauNom);
        return repository.save(matiere);
    }

    @Override
    public void supprimerMatiere(UUID id) {
        recupererMatiere(id);

        boolean refereceeAilleurs = departementRepository.existsByMatiereId(id)
                || affectationRepository.existsByMatiereId(id)
                || progressionRepository.existsByMatiereId(id);

        if (refereceeAilleurs) {
            throw new MatiereUtiliseeException(id);
        }

        repository.deleteById(id);
    }
}