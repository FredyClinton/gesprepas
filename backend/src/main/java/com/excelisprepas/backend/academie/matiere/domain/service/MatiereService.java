package com.excelisprepas.backend.academie.matiere.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.exception.MatiereUtiliseeException;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.in.*;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@Slf4j
public class MatiereService implements CreerMatiereUseCase, RecupererMatiereUseCase,
        ListerMatieresUseCase, RenommerMatiereUseCase, ModifierMatiereUseCase, SupprimerMatiereUseCase {

    private final MatiereRepositoryPort repository;
    private final DepartementRepositoryPort departementRepository;
    private final AffectationRepositoryPort affectationRepository;
    private final ProgressionRepositoryPort progressionRepository;
    private final FormationRepositoryPort formationRepository;

    public MatiereService(MatiereRepositoryPort repository,
                          DepartementRepositoryPort departementRepository,
                          AffectationRepositoryPort affectationRepository,
                          ProgressionRepositoryPort progressionRepository,
                          FormationRepositoryPort formationRepository) {
        this.repository = repository;
        this.departementRepository = departementRepository;
        this.affectationRepository = affectationRepository;
        this.progressionRepository = progressionRepository;
        this.formationRepository = formationRepository;
    }

    @Override
    public Matiere creerMatiere(String nom) {
        return creerMatiere(nom, null);
    }

    @Override
    public Matiere creerMatiere(String nom, String couleur) {
        Matiere matiere = new Matiere(UUID.randomUUID(), nom, couleur);
        matiere = repository.save(matiere);
        log.info("Matière créée : id={}, nom={}, couleur={}", matiere.getId(), nom, couleur);
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
    public Matiere modifierMatiere(UUID id, String nom, String couleur) {
        Matiere matiere = recupererMatiere(id);
        if (nom != null && !nom.isBlank()) {
            matiere.renommer(nom);
        }
        if (couleur != null) {
            matiere.changerCouleur(couleur.trim().isEmpty() ? null : couleur.trim());
        }
        matiere = repository.save(matiere);
        log.info("Matière modifiée : id={}, nom={}, couleur={}", id, matiere.getNom(), matiere.getCouleur());
        return matiere;
    }

    @Override
    public void supprimerMatiere(UUID id) {
        recupererMatiere(id);

        boolean refereceeAilleurs = departementRepository.existsByMatiereId(id)
                || affectationRepository.existsByMatiereId(id)
                || progressionRepository.existsByMatiereId(id)
                || formationRepository.existsByMatiereId(id);

        if (refereceeAilleurs) {
            log.warn("Suppression de matière refusée : id={} encore référencée ailleurs", id);
            throw new MatiereUtiliseeException(id);
        }

        repository.deleteById(id);
        log.info("Matière supprimée : id={}", id);
    }
}