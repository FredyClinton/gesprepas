package com.excelisprepas.backend.academie.affectation.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.exception.ConflitHoraireEnseignantException;
import com.excelisprepas.backend.academie.affectation.domain.exception.EnseignantSuspenduException;
import com.excelisprepas.backend.academie.affectation.domain.exception.SeanceNonEncorePasseeException;
import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.academie.affectation.domain.port.in.*;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectation.infrastructure.in.web.dto.ConflitHoraireResponse;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.auth.domain.model.ContexteUtilisateur;
import com.excelisprepas.backend.auth.domain.model.Permission;
import com.excelisprepas.backend.auth.domain.port.out.ContexteUtilisateurPort;
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
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Slf4j
@Transactional
public class AffectationService implements CreerCreneauUseCase, AssignerEnseignantUseCase,
        AnnulerAffectationUseCase, MarquerEffectueeUseCase, AnnulerEffectueeUseCase, ListerAffectationUseCase,
        ModifierMatiereUseCase, SupprimerAffectationUseCase, ListerAffectationsParEnseignantUseCase,
        ListerAffectationsParCentreUseCase, VerifierConflitHoraireUseCase {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH'h'mm");

    private final AffectationRepositoryPort affectationRepository;
    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;
    private final SalleRepositoryPort salleRepository;
    private final MatiereRepositoryPort matiereRepository;
    private final EnseignantRepositoryPort enseignantRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final DepartementRepositoryPort departementRepository;
    private final AffectationDepartementaleRepositoryPort rosterRepository;
    private final ContexteUtilisateurPort contexteUtilisateurPort;

    public AffectationService(AffectationRepositoryPort affectationRepository,
                              CentreRepositoryPort centreRepository,
                              FormationRepositoryPort formationRepository,
                              SalleRepositoryPort salleRepository,
                              MatiereRepositoryPort matiereRepository,
                              EnseignantRepositoryPort enseignantRepository,
                              SessionAcademiqueRepositoryPort sessionRepository,
                              DepartementRepositoryPort departementRepository,
                              AffectationDepartementaleRepositoryPort rosterRepository,
                              ContexteUtilisateurPort contexteUtilisateurPort) {
        this.affectationRepository = affectationRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.salleRepository = salleRepository;
        this.matiereRepository = matiereRepository;
        this.enseignantRepository = enseignantRepository;
        this.sessionRepository = sessionRepository;
        this.departementRepository = departementRepository;
        this.rosterRepository = rosterRepository;
        this.contexteUtilisateurPort = contexteUtilisateurPort;
    }

    public AffectationService(AffectationRepositoryPort affectationRepository,
                              CentreRepositoryPort centreRepository,
                              FormationRepositoryPort formationRepository,
                              SalleRepositoryPort salleRepository,
                              MatiereRepositoryPort matiereRepository,
                              EnseignantRepositoryPort enseignantRepository,
                              SessionAcademiqueRepositoryPort sessionRepository,
                              DepartementRepositoryPort departementRepository,
                              AffectationDepartementaleRepositoryPort rosterRepository) {
        this(affectationRepository, centreRepository, formationRepository, salleRepository,
                matiereRepository, enseignantRepository, sessionRepository, departementRepository,
                rosterRepository, null);
    }

    @Override
    public Affectation creerCreneau(UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                                    Jour jour, int seance, int semaine) {
        return creerCreneau(centreId, sessionId, formationId, salleId, matiereId, jour, seance, semaine, null, null, null);
    }

    @Override
    public Affectation creerCreneau(UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                                    Jour jour, int seance, int semaine, UUID enseignantId,
                                    LocalTime heureDebut, LocalTime heureFin) {
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

        LocalDate dateSeance = calculerDateSeance(session.getDateDebut(), semaine, jour);
        LocalTime debut = heureDebut != null ? heureDebut : Affectation.horaireDebutParDefaut(seance);
        LocalTime fin = heureFin != null ? heureFin : Affectation.horaireFinParDefaut(seance);

        if (fin.isBefore(debut) || fin.equals(debut)) {
            throw new IllegalArgumentException(
                    "L'heure de fin (" + fin + ") doit être strictement postérieure à l'heure de début (" + debut + ")");
        }

        StatutAffectation statutInitial = StatutAffectation.PLANIFIEE;

        if (enseignantId != null) {
            Enseignant enseignant = enseignantRepository.findByIdWithLock(enseignantId)
                    .or(() -> enseignantRepository.findById(enseignantId))
                    .orElseThrow(() -> new EnseignantIntrouvableException(enseignantId));
            if (enseignant.getStatut() == StatutEnseignant.SUSPENDU) {
                log.warn("Assignation refusée : enseignant {} suspendu", enseignantId);
                throw new EnseignantSuspenduException(enseignantId);
            }

            Departement departement = departementRepository.findByMatiereId(matiereId)
                    .orElseThrow(() -> new MatiereNonRattacheeDepartementException(matiereId));

            if (!rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(
                    enseignantId, sessionId, departement.getId())) {
                log.warn("Assignation refusée : enseignant {} non rattaché au département {} pour la session {}",
                        enseignantId, departement.getId(), sessionId);
                throw new EnseignantNonRattacheDepartementException(
                        enseignantId, sessionId, departement.getId());
            }

            // Contrôle des conflits d'emploi du temps
            verifierConflitsHoraire(enseignantId, null, dateSeance, debut, fin);
            statutInitial = StatutAffectation.ASSIGNEE;
        }

        Affectation affectation = new Affectation(
                UUID.randomUUID(), centreId, sessionId, formationId, salleId, matiereId,
                enseignantId, jour, seance, semaine, statutInitial, dateSeance, debut, fin);

        affectation = affectationRepository.save(affectation);
        log.info("Créneau créé : id={}, centreId={}, sessionId={}, salleId={}, enseignantId={}",
                affectation.getId(), centreId, sessionId, salleId, enseignantId);
        return affectation;
    }

    @Override
    public Affectation assignerEnseignant(UUID affectationId, UUID enseignantId) {
        return assignerEnseignant(affectationId, enseignantId, null, null);
    }

    @Override
    public Affectation assignerEnseignant(UUID affectationId, UUID enseignantId, LocalTime heureDebut, LocalTime heureFin) {
        Affectation affectation = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new AffectationIntrouvableException(affectationId));

        // Protection contre les accès concurrents : verrou pessimiste sur l'enseignant
        Enseignant enseignant = enseignantRepository.findByIdWithLock(enseignantId)
                .or(() -> enseignantRepository.findById(enseignantId))
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

        LocalDate dateSeance = determinerDateSeance(affectation, new HashMap<>());
        LocalTime debut = heureDebut != null ? heureDebut : affectation.getHeureDebut();
        LocalTime fin = heureFin != null ? heureFin : affectation.getHeureFin();

        if (fin.isBefore(debut) || fin.equals(debut)) {
            throw new IllegalArgumentException(
                    "L'heure de fin (" + fin + ") doit être strictement postérieure à l'heure de début (" + debut + ")");
        }

        // Contrôle strict des conflits d'emploi du temps
        verifierConflitsHoraire(enseignantId, affectation.getId(), dateSeance, debut, fin);

        affectation.assignerEnseignant(enseignantId);
        affectation.setDateSeance(dateSeance);
        affectation.setHoraires(debut, fin);

        Affectation affectationSauvegardee = affectationRepository.save(affectation);
        log.info("Enseignant assigné avec succès sans conflit : affectationId={}, enseignantId={}, date={}, {} - {}",
                affectationId, enseignantId, dateSeance, debut, fin);
        return affectationSauvegardee;
    }

    /**
     * Vérifie s'il existe un conflit horaire pour un enseignant sur une date et une période données.
     * Règle de chevauchement : nouveauDebut < seanceExistanteFin AND nouveauFin > seanceExistanteDebut.
     */
    public ConflitHoraireResponse verifierConflit(UUID enseignantId, LocalDate dateSeance, LocalTime debut, LocalTime fin, UUID affectationCouranteId) {
        if (fin.isBefore(debut) || fin.equals(debut)) {
            throw new IllegalArgumentException(
                    "L'heure de fin (" + fin + ") doit être strictement postérieure à l'heure de début (" + debut + ")");
        }

        List<Affectation> affectationsEnseignant = affectationRepository.findByEnseignantId(enseignantId);
        if (affectationsEnseignant == null || affectationsEnseignant.isEmpty()) {
            return ConflitHoraireResponse.sansConflit();
        }

        Map<UUID, LocalDate> cacheSessions = new HashMap<>();

        for (Affectation existante : affectationsEnseignant) {
            // Exclure la séance actuellement modifiée
            if (affectationCouranteId != null && existante.getId().equals(affectationCouranteId)) {
                continue;
            }
            // Exclure les séances annulées
            if (existante.getStatut() == StatutAffectation.ANNULEE) {
                continue;
            }

            LocalDate dateExistante = determinerDateSeance(existante, cacheSessions);
            if (!dateSeance.equals(dateExistante)) {
                continue;
            }

            LocalTime debutExistant = existante.getHeureDebut();
            LocalTime finExistant = existante.getHeureFin();

            // Chevauchement semi-ouvert : debut < finExistant AND fin > debutExistant
            if (debut.isBefore(finExistant) && fin.isAfter(debutExistant)) {
                String centreNom = centreRepository.findById(existante.getCentreId())
                        .map(Centre::getNom).orElse("Centre inconnu");
                String formationNom = formationRepository.findById(existante.getFormationId())
                        .map(Formation::getNom).orElse("Classe inconnue");
                String matiereNom = matiereRepository.findById(existante.getMatiereId())
                        .map(m -> m.getNom()).orElse(null);

                String message = String.format(
                        "Impossible d'affecter cet enseignant : il est déjà programmé le %s de %s à %s au centre %s, classe %s.",
                        dateSeance.format(DATE_FORMATTER),
                        debutExistant.format(TIME_FORMATTER),
                        finExistant.format(TIME_FORMATTER),
                        centreNom,
                        formationNom
                );

                return ConflitHoraireResponse.avecConflit(
                        message,
                        existante.getId(),
                        dateSeance,
                        debutExistant,
                        finExistant,
                        existante.getCentreId(),
                        centreNom,
                        existante.getFormationId(),
                        formationNom,
                        existante.getMatiereId(),
                        matiereNom
                );
            }
        }

        return ConflitHoraireResponse.sansConflit();
    }

    private void verifierConflitsHoraire(UUID enseignantId, UUID affectationCouranteId, LocalDate dateSeance, LocalTime debut, LocalTime fin) {
        ConflitHoraireResponse conflit = verifierConflit(enseignantId, dateSeance, debut, fin, affectationCouranteId);
        if (conflit.conflit()) {
            log.warn("Conflit horaire détecté pour l'enseignant {} le {} de {} à {}: {}",
                    enseignantId, dateSeance, debut, fin, conflit.message());
            throw new ConflitHoraireEnseignantException(
                    enseignantId,
                    conflit.affectationExistanteId(),
                    conflit.dateSeance(),
                    conflit.heureDebut(),
                    conflit.heureFin(),
                    conflit.centreId(),
                    conflit.centreNom(),
                    conflit.formationId(),
                    conflit.formationNom(),
                    conflit.matiereId(),
                    conflit.matiereNom()
            );
        }
    }

    private LocalDate determinerDateSeance(Affectation aff, Map<UUID, LocalDate> cacheSessions) {
        if (aff.getDateSeance() != null) {
            return aff.getDateSeance();
        }
        LocalDate dateDebutSession = cacheSessions.computeIfAbsent(aff.getSessionId(), sid ->
                sessionRepository.findById(sid)
                        .map(SessionAcademique::getDateDebut)
                        .orElse(null)
        );
        if (dateDebutSession == null) {
            // Repli sûr si la session n'est pas trouvée (ex: tests partiels)
            dateDebutSession = LocalDate.of(2026, 1, 1);
        }
        return calculerDateSeance(dateDebutSession, aff.getSemaine(), aff.getJour());
    }

    private static LocalDate calculerDateSeance(LocalDate dateDebutSession, int semaine, Jour jour) {
        int jourOffset = switch (jour) {
            case LUNDI -> 0;
            case MARDI -> 1;
            case MERCREDI -> 2;
            case JEUDI -> 3;
            case VENDREDI -> 4;
            case SAMEDI -> 5;
        };
        return dateDebutSession.plusDays((long) (semaine - 1) * 7 + jourOffset);
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
        verifierAccesCentre(affectation.getCentreId());

        UUID sessionId = affectation.getSessionId();
        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        LocalDate dateSeance = calculerDateSeance(session.getDateDebut(), affectation.getSemaine(), affectation.getJour());
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
        verifierAccesCentre(affectation.getCentreId());
        affectation.annulerEffectuee();
        affectation = this.affectationRepository.save(affectation);
        log.info("Marquage effectuée annulé : id={}", affectationId);
        return affectation;
    }

    private void verifierAccesCentre(UUID centreId) {
        if (contexteUtilisateurPort == null) return;
        ContexteUtilisateur contexte = contexteUtilisateurPort.courant();
        if (!contexte.possedePourCentre(Permission.ACADEMIE_MARQUER_EFFECTUEE, centreId)) {
            throw new AccesCentreInterditException(centreId);
        }
    }

    @Override
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<Affectation> listerParEnseignant(UUID enseignantId, UUID sessionId) {
        return affectationRepository.findByEnseignantIdAndSessionId(enseignantId, sessionId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Affectation> listerParCentre(UUID centreId, UUID sessionId) {
        return affectationRepository.findByCentreIdAndSessionId(centreId, sessionId);
    }
}
