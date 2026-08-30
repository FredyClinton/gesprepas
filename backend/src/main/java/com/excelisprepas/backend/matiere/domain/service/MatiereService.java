package com.excelisprepas.backend.matiere.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.matiere.domain.exception.MatiereUtiliseeException;
import com.excelisprepas.backend.matiere.domain.model.Matiere;
import com.excelisprepas.backend.matiere.domain.port.in.*;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@Slf4j
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
        matiere = repository.save(matiere);
        log.info("Matière créée : id={}, nom={}", matiere.getId(), nom);
        return matiere;
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
        matiere = repository.save(matiere);
        log.info("Matière renommée : id={}, nouveauNom={}", id, nouveauNom);
        return matiere;
    }

    @Override
    public void supprimerMatiere(UUID id) {
        recupererMatiere(id);

        boolean refereceeAilleurs = departementRepository.existsByMatiereId(id)
                || affectationRepository.existsByMatiereId(id)
                || progressionRepository.existsByMatiereId(id);

        if (refereceeAilleurs) {
            log.warn("Suppression de matière refusée : id={} encore référencée ailleurs", id);
            throw new MatiereUtiliseeException(id);
        }

        repository.deleteById(id);
        log.info("Matière supprimée : id={}", id);
    }
}