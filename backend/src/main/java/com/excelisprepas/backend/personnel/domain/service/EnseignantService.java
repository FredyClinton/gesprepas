package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.personnel.domain.exception.EnseignantUtiliseException;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.shared.exception.EnseignantIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatriculeDejaUtiliseException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class EnseignantService implements CreerEnseignantUseCase, RecupererEnseignantUseCase,
        ListerEnseignantsUseCase, RenommerEnseignantUseCase, ModifierCoutParSeanceUseCase,
        SuspendreEnseignantUseCase, ReactiverEnseignantUseCase, SupprimerEnseignantUseCase {

    private final EnseignantRepositoryPort repository;
    private final AffectationRepositoryPort affectationRepository;

    public EnseignantService(EnseignantRepositoryPort repository,
                             AffectationRepositoryPort affectationRepository) {
        this.repository = repository;
        this.affectationRepository = affectationRepository;
    }

    @Override
    public Enseignant creerEnseignant(String nom, String prenom, String matricule, BigDecimal coutParSeance) {
        if (repository.existsByMatricule(matricule)) {
            throw new MatriculeDejaUtiliseException(matricule);
        }

        Enseignant enseignant = new Enseignant(UUID.randomUUID(), nom, prenom, matricule, coutParSeance);
        return repository.save(enseignant);
    }

    @Override
    public Enseignant recupererEnseignant(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EnseignantIntrouvableException(id));
    }

    @Override
    public List<Enseignant> listerEnseignants() {
        return repository.findAll();
    }

    @Override
    public Enseignant renommerEnseignant(UUID id, String nouveauNom, String nouveauPrenom) {
        Enseignant enseignant = recupererEnseignant(id);
        enseignant.renommer(nouveauNom, nouveauPrenom);
        return repository.save(enseignant);
    }

    @Override
    public Enseignant modifierCoutParSeance(UUID id, BigDecimal nouveauCout) {
        Enseignant enseignant = recupererEnseignant(id);
        enseignant.mettreAJourCoutParSeance(nouveauCout);
        return repository.save(enseignant);
    }

    @Override
    public Enseignant suspendreEnseignant(UUID id) {
        Enseignant enseignant = recupererEnseignant(id);
        enseignant.suspendre();
        return repository.save(enseignant);
    }

    @Override
    public Enseignant reactiverEnseignant(UUID id) {
        Enseignant enseignant = recupererEnseignant(id);
        enseignant.reactiver();
        return repository.save(enseignant);
    }

    @Override
    public void supprimerEnseignant(UUID id) {
        recupererEnseignant(id); // vérifie l'existence

        if (affectationRepository.existsByEnseignantId(id)) {
            throw new EnseignantUtiliseException(id);
        }

        repository.deleteById(id);
    }
}