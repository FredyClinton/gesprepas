package com.excelisprepas.backend.formation.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.exception.FormationUtiliseeException;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.in.*;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;

import java.util.List;
import java.util.UUID;

public class FormationService implements CreerFormationUseCase, RecupererFormationUseCase,
        ListerFormationsUseCase, RenommerFormationUseCase, SupprimerFormationUseCase {

    private final FormationRepositoryPort repository;
    private final CentreRepositoryPort centreRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final SalleRepositoryPort salleRepository;
    private final AffectationRepositoryPort affectationRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final ProgressionRepositoryPort progressionRepository;

    public FormationService(FormationRepositoryPort repository,
                            CentreRepositoryPort centreRepository,
                            SessionAcademiqueRepositoryPort sessionRepository,
                            SalleRepositoryPort salleRepository,
                            AffectationRepositoryPort affectationRepository,
                            ApprenantRepositoryPort apprenantRepository,
                            ProgressionRepositoryPort progressionRepository) {
        this.repository = repository;
        this.centreRepository = centreRepository;
        this.sessionRepository = sessionRepository;
        this.salleRepository = salleRepository;
        this.affectationRepository = affectationRepository;
        this.apprenantRepository = apprenantRepository;
        this.progressionRepository = progressionRepository;
    }

    @Override
    public Formation creerFormation(String nom, UUID centreId, UUID sessionId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        if (sessionRepository.findById(sessionId).isEmpty()) {
            throw new SessionIntrouvableException(sessionId);
        }

        Formation formation = new Formation(UUID.randomUUID(), nom, centreId, sessionId);
        return repository.save(formation);
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
        return repository.save(formation);
    }

    @Override
    public void supprimerFormation(UUID id) {
        recupererFormation(id); // vérifie l'existence

        boolean referenceeAilleurs = salleRepository.existsByFormationId(id)
                || affectationRepository.existsByFormationId(id)
                || apprenantRepository.existsByFormationId(id)
                || progressionRepository.existsByFormationId(id);

        if (referenceeAilleurs) {
            throw new FormationUtiliseeException(id);
        }

        repository.deleteById(id);
    }
}