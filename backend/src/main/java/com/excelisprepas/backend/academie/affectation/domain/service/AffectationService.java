package com.excelisprepas.backend.academie.affectation.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.exception.EnseignantSuspenduException;
import com.excelisprepas.backend.academie.affectation.domain.exception.SeanceNonEncorePasseeException;
import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.academie.affectation.domain.port.in.*;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.model.StatutCentre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
public class AffectationService implements CreerCreneauUseCase, AssignerEnseignantUseCase,
        AnnulerAffectationUseCase, MarquerEffectueeUseCase, AnnulerEffectueeUseCase, ListerAffectationUseCase,
        ModifierMatiereUseCase, SupprimerAffectationUseCase, ListerAffectationsParEnseignantUseCase {

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
        Centre centre = centreRepository.findById(centreId)
                .orElseThrow(() -> new CentreIntrouvableException(centreId));
        if (centre.getStatut() == StatutCentre.FERME) {
            log.warn("Création de créneau refusée : centre {} fermé", centreId);
            throw new CentreFermeException(centreId);
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
            log.warn("Création de créneau refusée : session {} clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }
        if (!formation.contientMatiere(matiereId)) {
            log.warn("Création de créneau refusée : matière {} non au programme de la formation {}", matiereId, formationId);
            throw new MatiereNonAuProgrammeException(formationId, matiereId);
        }

        if (affectationRepository.existsBySalleIdAndJourAndSemaineAndSeance(salleId, jour, semaine, seance)) {
            log.warn("Création de créneau refusée : salle {} déjà planifiée (jour={}, semaine={}, séance={})",
                    salleId, jour, semaine, seance);
            throw new CreneauDejaPlanifieException(salleId, jour, semaine, seance);
        }

        Affectation affectation = new Affectation(
                UUID.randomUUID(), centreId, sessionId, formationId, salleId, matiereId,
                null, jour, seance, semaine, StatutAffectation.PLANIFIEE);

        affectation = affectationRepository.save(affectation);
        log.info("Créneau créé : id={}, centreId={}, sessionId={}, salleId={}", affectation.getId(), centreId, sessionId, salleId);
        return affectation;
    }

    @Override
    public Affectation assignerEnseignant(UUID affectationId, UUID enseignantId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));

        Enseignant enseignant = enseignantRepository.findById(enseignantId)
                .orElseThrow(() -> new EnseignantIntrouvableException(enseignantId));
        if (enseignant.getStatut() == StatutEnseignant.SUSPENDU) {
            log.warn("Assignation refusée : enseignant {} suspendu", enseignantId);
            throw new EnseignantSuspenduException(enseignantId);
        }

        UUID matiereId = affectation.getMatiereId();
        Departement departement = departementRepository.findByMatiereId(matiereId)
                .orElseThrow(() -> new MatiereNonRattacheeDepartementException(matiereId));

        if (!rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(
                enseignantId, affectation.getSessionId(), departement.getId())) {
            log.warn("Assignation refusée : enseignant {} non rattaché au département {} pour la session {}",
                    enseignantId, departement.getId(), affectation.getSessionId());
            throw new EnseignantNonRattacheDepartementException(
                    enseignantId, affectation.getSessionId(), departement.getId());
        }

        affectation.assignerEnseignant(enseignantId);
        Affectation affectationSauvegardee = affectationRepository.save(affectation);
        log.info("Enseignant assigné : affectationId={}, enseignantId={}", affectationId, enseignantId);
        return affectationSauvegardee;
    }

    @Override
    public Affectation modifierMatiere(UUID affectationId, UUID nouvelleMatiereId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));
        if (matiereRepository.findById(nouvelleMatiereId).isEmpty()) {
            throw new MatiereIntrouvableException(nouvelleMatiereId);
        }
        UUID formationId = affectation.getFormationId();
        Formation formation = formationRepository.findById(formationId)
                .orElseThrow(() -> new FormationIntrouvableException(formationId));
        if (!formation.contientMatiere(nouvelleMatiereId)) {
            throw new MatiereNonAuProgrammeException(formation.getId(), nouvelleMatiereId);
        }
        affectation.modifierMatiere(nouvelleMatiereId);
        Affectation affectationSauvegardee = affectationRepository.save(affectation);
        log.info("Matière modifiée : affectationId={}, nouvelleMatiereId={}", affectationId, nouvelleMatiereId);
        return affectationSauvegardee;
    }

    @Override
    public void supprimerAffectation(UUID id) {
        Affectation affectation = affectationRepository.findById(id)
                .orElseThrow(() -> new AffectationIntrouvableException(id));
        if (affectation.getStatut() == StatutAffectation.EFFECTUEE) {
            throw new IllegalStateException(
                    "Impossible de supprimer : le créneau est déjà EFFECTUEE");
        }
        affectationRepository.deleteById(id);
        log.info("Affectation supprimée : id={}", id);
    }

    @Override
    public Affectation annulerAffectation(UUID affectationId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));
        affectation.annuler();
        affectation = this.affectationRepository.save(affectation);
        log.info("Affectation annulée : id={}", affectationId);
        return affectation;
    }

    @Override
    public Affectation marquerEffectuee(UUID affectationId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));

        UUID sessionId = affectation.getSessionId();
        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        LocalDate dateSeance = session.getDateDebut()
                .plusDays((long) (affectation.getSemaine() - 1) * 7 + affectation.getJour().ordinal());
        if (dateSeance.isAfter(LocalDate.now())) {
            log.warn("Marquage effectuée refusé : affectation {} prévue le {} (pas encore passée)",
                    affectationId, dateSeance);
            throw new SeanceNonEncorePasseeException(affectationId, dateSeance);
        }

        affectation.marquerEffectuee();
        affectation = this.affectationRepository.save(affectation);
        log.info("Affectation marquée effectuée : id={}", affectationId);
        return affectation;
    }

    @Override
    public Affectation annulerEffectuee(UUID affectationId) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));
        affectation.annulerEffectuee();
        affectation = this.affectationRepository.save(affectation);
        log.info("Marquage effectuée annulé : id={}", affectationId);
        return affectation;
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

    @Override
    public List<Affectation> listerParEnseignant(UUID enseignantId, UUID sessionId) {
        return affectationRepository.findByEnseignantIdAndSessionId(enseignantId, sessionId);
    }
}