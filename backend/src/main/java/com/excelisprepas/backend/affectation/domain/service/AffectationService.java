package com.excelisprepas.backend.affectation.domain.service;


import com.excelisprepas.backend.affectation.domain.exception.EnseignantSuspenduException;
import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.affectation.domain.port.in.AssignerEnseignantUseCase;
import com.excelisprepas.backend.affectation.domain.port.in.CreerCreneauUseCase;
import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

import java.util.UUID;

public class AffectationService implements CreerCreneauUseCase, AssignerEnseignantUseCase {

    private final AffectationRepositoryPort affectationRepository;
    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;
    private final SalleRepositoryPort salleRepository;
    private final MatiereRepositoryPort matiereRepository;
    private final EnseignantRepositoryPort enseignantRepository;

    public AffectationService(AffectationRepositoryPort affectationRepository,
                              CentreRepositoryPort centreRepository,
                              FormationRepositoryPort formationRepository,
                              SalleRepositoryPort salleRepository,
                              MatiereRepositoryPort matiereRepository,
                              EnseignantRepositoryPort enseignantRepository) {
        this.affectationRepository = affectationRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.salleRepository = salleRepository;
        this.matiereRepository = matiereRepository;
        this.enseignantRepository = enseignantRepository;
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

    @Override
    public Affectation assignerEnseignant(UUID affectationId, UUID enseignantId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));

        Enseignant enseignant = enseignantRepository.findById(enseignantId)
                .orElseThrow(() -> new EnseignantIntrouvableException(enseignantId));

        if (enseignant.getStatut() == StatutEnseignant.SUSPENDU) {
            throw new EnseignantSuspenduException(enseignantId);
        }

        affectation.assignerEnseignant(enseignantId);
        return affectationRepository.save(affectation);
    }
}