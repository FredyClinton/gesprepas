package com.excelisprepas.backend.academie.formation.domain.service;

import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.exception.FormationUtiliseeException;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.in.*;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
public class FormationService implements CreerFormationUseCase, RecupererFormationUseCase,
        ListerFormationsUseCase, RenommerFormationUseCase, SupprimerFormationUseCase,
        AssocierMatiereFormationUseCase, DissocierMatiereFormationUseCase, ListerMatieresFormationUseCase {

    private final FormationRepositoryPort repository;
    private final MatiereRepositoryPort matiereRepository;
    private final SalleRepositoryPort salleRepository;
    private final AffectationRepositoryPort affectationRepository;
    private final ProgressionRepositoryPort progressionRepository;
    private final CentreFormationAbonnementRepositoryPort abonnementRepository;

    public FormationService(FormationRepositoryPort repository,
                            MatiereRepositoryPort matiereRepository,
                            SalleRepositoryPort salleRepository,
                            AffectationRepositoryPort affectationRepository,
                            ProgressionRepositoryPort progressionRepository,
                            CentreFormationAbonnementRepositoryPort abonnementRepository) {
        this.repository = repository;
        this.matiereRepository = matiereRepository;
        this.salleRepository = salleRepository;
        this.affectationRepository = affectationRepository;
        this.progressionRepository = progressionRepository;
        this.abonnementRepository = abonnementRepository;
    }

    @Override
    public Formation creerFormation(String nom) {
        return creerFormation(nom, null);
    }

    @Override
    public Formation creerFormation(String nom, Set<UUID> matiereIds) {
        if (matiereIds != null) {
            for (UUID matiereId : matiereIds) {
                if (matiereRepository.findById(matiereId).isEmpty()) {
                    throw new MatiereIntrouvableException(matiereId);
                }
            }
        }

        Formation formation = new Formation(UUID.randomUUID(), nom, matiereIds);
        formation = repository.save(formation);
        log.info("Formation créée : id={}, nom={}, matieresCount={}", formation.getId(), nom, formation.getMatiereIds().size());
        return formation;
    }

    @Override
    public Formation recupererFormation(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new FormationIntrouvableException(id));
    }

    @Override
    public List<Formation> listerFormations() {
        return repository.findAll();
    }

    @Override
    public Formation renommerFormation(UUID id, String nouveauNom) {
        Formation formation = recupererFormation(id);
        formation.renommer(nouveauNom);
        formation = repository.save(formation);
        log.info("Formation renommée : id={}, nouveauNom={}", id, nouveauNom);
        return formation;
    }

    @Override
    public Formation associerMatiere(UUID formationId, UUID matiereId) {
        Formation formation = recupererFormation(formationId);
        if (matiereRepository.findById(matiereId).isEmpty()) {
            throw new MatiereIntrouvableException(matiereId);
        }
        formation.ajouterMatiere(matiereId);
        formation = repository.save(formation);
        log.info("Matière associée à la formation : formationId={}, matiereId={}", formationId, matiereId);
        return formation;
    }

    @Override
    public Formation dissocierMatiere(UUID formationId, UUID matiereId) {
        Formation formation = recupererFormation(formationId);
        if (progressionRepository.existsByFormationIdAndMatiereId(formationId, matiereId)) {
            throw new IllegalStateException("Impossible de dissocier la matière : des progressions y sont rattachées pour cette formation");
        }
        formation.retirerMatiere(matiereId);
        formation = repository.save(formation);
        log.info("Matière dissociée de la formation : formationId={}, matiereId={}", formationId, matiereId);
        return formation;
    }

    @Override
    public List<Matiere> listerMatieres(UUID formationId) {
        Formation formation = recupererFormation(formationId);
        return formation.getMatiereIds().stream()
                .map(matiereRepository::findById)
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }

    @Override
    public void supprimerFormation(UUID id) {
        recupererFormation(id); // vérifie l'existence

        boolean referenceeAilleurs = salleRepository.existsByFormationId(id)
                || affectationRepository.existsByFormationId(id)
                || progressionRepository.existsByFormationId(id)
                || abonnementRepository.existsByFormationId(id);

        if (referenceeAilleurs) {
            log.warn("Suppression de formation refusée : id={} encore référencée ailleurs", id);
            throw new FormationUtiliseeException(id);
        }

        repository.deleteById(id);
        log.info("Formation supprimée : id={}", id);
    }
}
