package com.excelisprepas.backend.affectation.domain.service;


import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.affectation.domain.port.in.CreerCreneauUseCase;
import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

import java.util.UUID;

public class AffectationService implements CreerCreneauUseCase {

    private final AffectationRepositoryPort affectationRepository;
    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;
    private final SalleRepositoryPort salleRepository;
    private final MatiereRepositoryPort matiereRepository;

    public AffectationService(AffectationRepositoryPort affectationRepository,
                              CentreRepositoryPort centreRepository,
                              FormationRepositoryPort formationRepository,
                              SalleRepositoryPort salleRepository,
                              MatiereRepositoryPort matiereRepository) {
        this.affectationRepository = affectationRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.salleRepository = salleRepository;
        this.matiereRepository = matiereRepository;
    }

    @Override
    public Affectation creerCreneau(UUID centreId, UUID formationId, UUID salleId, UUID matiereId,
                                    int seance, int semaine) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        if (formationRepository.findById(formationId).isEmpty()) {
            throw new FormationIntrouvableException(formationId);
        }
        if (salleRepository.findById(salleId).isEmpty()) {
            throw new SalleIntrouvableException(salleId);
        }
        if (matiereRepository.findById(matiereId).isEmpty()) {
            throw new MatiereIntrouvableException(matiereId);
        }
        if (affectationRepository.existsBySalleIdAndSemaineAndSeance(salleId, semaine, seance)) {
            throw new CreneauDejaPlanifieException(salleId, semaine, seance);
        }

        Affectation affectation = new Affectation(
                UUID.randomUUID(), centreId, formationId, salleId, matiereId,
                null, seance, semaine, StatutAffectation.PLANIFIEE);

        return affectationRepository.save(affectation);
    }
}