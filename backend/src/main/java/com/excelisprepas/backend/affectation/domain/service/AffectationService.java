package com.excelisprepas.backend.affectation.domain.service;

import com.excelisprepas.backend.affectation.domain.exception.EnseignantSuspenduException;
import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.model.Jour;
import com.excelisprepas.backend.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.affectation.domain.port.in.*;
import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.departement.domain.model.Departement;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.formation.domain.model.Formation;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

import java.util.List;
import java.util.UUID;

public class AffectationService implements CreerCreneauUseCase, AssignerEnseignantUseCase,
        AnnulerAffectationUseCase, MarquerEffectueeUseCase, ListerAffectationUseCase, ModifierMatiereUseCase,
        SupprimerAffectationUseCase {

    private final AffectationRepositoryPort affectationRepository;
    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;
    private final SalleRepositoryPort salleRepository;
    private final MatiereRepositoryPort matiereRepository;
    private final EnseignantRepositoryPort enseignantRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final DepartementRepositoryPort departementRepository;
    private final AffectationDepartementaleRepositoryPort rosterRepository;

    public AffectationService(AffectationRepositoryPort affectationRepository,
                              CentreRepositoryPort centreRepository,
                              FormationRepositoryPort formationRepository,
                              SalleRepositoryPort salleRepository,
                              MatiereRepositoryPort matiereRepository,
                              EnseignantRepositoryPort enseignantRepository,
                              SessionAcademiqueRepositoryPort sessionRepository,
                              DepartementRepositoryPort departementRepository,
                              AffectationDepartementaleRepositoryPort rosterRepository) {
        this.affectationRepository = affectationRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.salleRepository = salleRepository;
        this.matiereRepository = matiereRepository;
        this.enseignantRepository = enseignantRepository;
        this.sessionRepository = sessionRepository;
        this.departementRepository = departementRepository;
        this.rosterRepository = rosterRepository;
    }

    @Override
    public Affectation creerCreneau(UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                                    Jour jour, int seance, int semaine) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        Formation formation = formationRepository.findById(formationId)
                .orElseThrow(() -> new FormationIntrouvableException(formationId));
        if (salleRepository.findById(salleId).isEmpty()) {
            throw new SalleIntrouvableException(salleId);
        }
        if (matiereRepository.findById(matiereId).isEmpty()) {
            throw new MatiereIntrouvableException(matiereId);
        }

        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            throw new SessionNonUtilisableException(sessionId);
        }
        if (!formation.getSessionId().equals(sessionId)) {
            throw new FormationSessionIncoherenteException(formationId, sessionId);
        }

        if (affectationRepository.existsBySalleIdAndJourAndSemaineAndSeance(salleId, jour, semaine, seance)) {
            throw new CreneauDejaPlanifieException(salleId, jour, semaine, seance);
        }

        Affectation affectation = new Affectation(
                UUID.randomUUID(), centreId, sessionId, formationId, salleId, matiereId,
                null, jour, seance, semaine, StatutAffectation.PLANIFIEE);

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

        Departement departement = departementRepository.findByMatiereId(affectation.getMatiereId())
                .orElseThrow(() -> new MatiereNonRattacheeDepartementException(affectation.getMatiereId()));

        if (!rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(
                enseignantId, affectation.getSessionId(), departement.getId())) {
            throw new EnseignantNonRattacheDepartementException(
                    enseignantId, affectation.getSessionId(), departement.getId());
        }

        affectation.assignerEnseignant(enseignantId);
        return affectationRepository.save(affectation);
    }

    @Override
    public Affectation modifierMatiere(UUID affectationId, UUID nouvelleMatiereId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));
        if (matiereRepository.findById(nouvelleMatiereId).isEmpty()) {
            throw new MatiereIntrouvableException(nouvelleMatiereId);
        }
        affectation.modifierMatiere(nouvelleMatiereId);
        return affectationRepository.save(affectation);
    }

    @Override
    public void supprimerAffectation(UUID id) {
        if (affectationRepository.findById(id).isEmpty()) {
            throw new AffectationIntrouvableException(id);
        }
        affectationRepository.deleteById(id);
    }

    @Override
    public Affectation annulerAffectation(UUID affectationId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));
        affectation.annuler();
        return this.affectationRepository.save(affectation);
    }

    @Override
    public Affectation marquerEffectuee(UUID affectationId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));
        affectation.marquerEffectuee();
        return this.affectationRepository.save(affectation);
    }

    @Override
    public List<Affectation> listerAffectations(UUID sessionId, UUID centreId, UUID matiereId, int semaine) {
        if (centreId != null && matiereId != null) {
            return affectationRepository.findBySessionIdAndMatiereIdAndCentreIdAndSemaine(
                    sessionId, matiereId, centreId, semaine);
        }
        if (centreId != null) {
            return affectationRepository.findBySessionIdAndCentreIdAndSemaine(sessionId, centreId, semaine);
        }
        if (matiereId != null) {
            return affectationRepository.findBySessionIdAndMatiereIdAndSemaine(sessionId, matiereId, semaine);
        }
        return affectationRepository.findBySessionIdAndSemaine(sessionId, semaine);
    }
}