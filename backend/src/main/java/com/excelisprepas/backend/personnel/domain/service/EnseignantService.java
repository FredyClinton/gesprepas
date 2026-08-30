package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.gelenseignants.domain.port.in.VerifierAutoriseGestionEnseignantsUseCase;
import com.excelisprepas.backend.personnel.domain.exception.EnseignantUtiliseException;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.shared.exception.EnseignantIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatriculeDejaUtiliseException;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Slf4j
public class EnseignantService implements CreerEnseignantUseCase, RecupererEnseignantUseCase,
        ListerEnseignantsUseCase, RenommerEnseignantUseCase, ModifierCoutParSeanceUseCase,
        SuspendreEnseignantUseCase, ReactiverEnseignantUseCase, SupprimerEnseignantUseCase {

    private final EnseignantRepositoryPort repository;
    private final AffectationRepositoryPort affectationRepository;
    private final VerifierAutoriseGestionEnseignantsUseCase gel;

    public EnseignantService(EnseignantRepositoryPort repository,
                             AffectationRepositoryPort affectationRepository,
                             VerifierAutoriseGestionEnseignantsUseCase gel) {
        this.repository = repository;
        this.affectationRepository = affectationRepository;
        this.gel = gel;
    }

    @Override
    public Enseignant creerEnseignant(RoleUtilisateur appelant, String nom, String prenom, String matricule, BigDecimal coutParSeance) {
        gel.verifierAutorise(appelant);
        if (repository.existsByMatricule(matricule)) {
            log.warn("Création d'enseignant refusée : matricule {} déjà utilisé", matricule);
            throw new MatriculeDejaUtiliseException(matricule);
        }

        Enseignant enseignant = new Enseignant(UUID.randomUUID(), nom, prenom, matricule, coutParSeance);
        enseignant = repository.save(enseignant);
        log.info("Enseignant créé : id={}, matricule={}, nom={} {}", enseignant.getId(), matricule, nom, prenom);
        return enseignant;
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
    public Enseignant renommerEnseignant(RoleUtilisateur appelant, UUID id, String nouveauNom, String nouveauPrenom) {
        gel.verifierAutorise(appelant);
        Enseignant enseignant = recupererEnseignant(id);
        enseignant.renommer(nouveauNom, nouveauPrenom);
        enseignant = repository.save(enseignant);
        log.info("Enseignant renommé : id={}, nouveauNom={} {}", id, nouveauNom, nouveauPrenom);
        return enseignant;
    }

    @Override
    public Enseignant modifierCoutParSeance(RoleUtilisateur appelant, UUID id, BigDecimal nouveauCout) {
        gel.verifierAutorise(appelant);
        Enseignant enseignant = recupererEnseignant(id);
        enseignant.mettreAJourCoutParSeance(nouveauCout);
        enseignant = repository.save(enseignant);
        log.info("Coût par séance modifié : enseignantId={}, nouveauCout={}", id, nouveauCout);
        return enseignant;
    }

    @Override
    public Enseignant suspendreEnseignant(RoleUtilisateur appelant, UUID id) {
        gel.verifierAutorise(appelant);
        Enseignant enseignant = recupererEnseignant(id);
        enseignant.suspendre();
        enseignant = repository.save(enseignant);
        log.info("Enseignant suspendu : id={}", id);
        return enseignant;
    }

    @Override
    public Enseignant reactiverEnseignant(RoleUtilisateur appelant, UUID id) {
        gel.verifierAutorise(appelant);
        Enseignant enseignant = recupererEnseignant(id);
        enseignant.reactiver();
        enseignant = repository.save(enseignant);
        log.info("Enseignant réactivé : id={}", id);
        return enseignant;
    }

    @Override
    public void supprimerEnseignant(RoleUtilisateur appelant, UUID id) {
        gel.verifierAutorise(appelant);
        recupererEnseignant(id); // vérifie l'existence

        if (affectationRepository.existsByEnseignantId(id)) {
            log.warn("Suppression d'enseignant refusée : id={} encore utilisé dans des affectations", id);
            throw new EnseignantUtiliseException(id);
        }

        repository.deleteById(id);
        log.info("Enseignant supprimé : id={}", id);
    }
}