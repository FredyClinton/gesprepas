package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.gelenseignants.domain.port.in.VerifierAutoriseGestionEnseignantsUseCase;
import com.excelisprepas.backend.personnel.domain.exception.EnseignantUtiliseException;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.FicheAncienneteEnseignant;
import com.excelisprepas.backend.personnel.domain.model.ResumeSessionEnseignant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.EnseignantIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatriculeDejaUtiliseException;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
public class EnseignantService implements CreerEnseignantUseCase, RecupererEnseignantUseCase,
        ListerEnseignantsUseCase, RenommerEnseignantUseCase, ModifierCoutParSeanceUseCase,
        SuspendreEnseignantUseCase, ReactiverEnseignantUseCase, SupprimerEnseignantUseCase,
        ConsulterAncienneteEnseignantUseCase {

    private final EnseignantRepositoryPort repository;
    private final AffectationRepositoryPort affectationRepository;
    private final VerifierAutoriseGestionEnseignantsUseCase gel;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final AffectationDepartementaleRepositoryPort rosterRepository;
    private final DepartementRepositoryPort departementRepository;

    public EnseignantService(EnseignantRepositoryPort repository,
                             AffectationRepositoryPort affectationRepository,
                             VerifierAutoriseGestionEnseignantsUseCase gel,
                             SessionAcademiqueRepositoryPort sessionRepository,
                             AffectationDepartementaleRepositoryPort rosterRepository,
                             DepartementRepositoryPort departementRepository) {
        this.repository = repository;
        this.affectationRepository = affectationRepository;
        this.gel = gel;
        this.sessionRepository = sessionRepository;
        this.rosterRepository = rosterRepository;
        this.departementRepository = departementRepository;
    }

    @Override
    public Enseignant creerEnseignant(RoleUtilisateur appelant, String nom, String prenom, String matricule, BigDecimal coutParSeance,
                                      String telephone, String numeroCni, String ecoleFonction, String niveauGrade) {
        return creerEnseignant(appelant, nom, prenom, matricule, coutParSeance, telephone, numeroCni, ecoleFonction, niveauGrade, LocalDate.now());
    }

    @Override
    public Enseignant creerEnseignant(RoleUtilisateur appelant, String nom, String prenom, String matricule, BigDecimal coutParSeance,
                                      String telephone, String numeroCni, String ecoleFonction, String niveauGrade, LocalDate dateRecrutement) {
        gel.verifierAutorise(appelant);
        if (repository.existsByMatricule(matricule)) {
            log.warn("Création d'enseignant refusée : matricule {} déjà utilisé", matricule);
            throw new MatriculeDejaUtiliseException(matricule);
        }

        LocalDate dateEffective = dateRecrutement != null ? dateRecrutement : LocalDate.now();
        Enseignant enseignant = Enseignant.reconstituer(UUID.randomUUID(), nom, prenom, matricule, coutParSeance,
                com.excelisprepas.backend.personnel.domain.model.StatutEnseignant.ACTIF,
                telephone, numeroCni, ecoleFonction, niveauGrade, dateEffective);
        enseignant = repository.save(enseignant);
        log.info("Enseignant créé : id={}, matricule={}, nom={} {}, dateRecrutement={}", enseignant.getId(), matricule, nom, prenom, dateEffective);
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

        // Les cours pas encore effectués (ASSIGNEE) redeviennent non assignés
        // (PLANIFIEE) — un enseignant suspendu ne peut plus les assurer. Les
        // séances déjà EFFECTUEE ne sont jamais touchées.
        List<Affectation> creneauxNonEffectues =
                affectationRepository.findByEnseignantIdAndStatut(id, StatutAffectation.ASSIGNEE);
        for (Affectation creneau : creneauxNonEffectues) {
            creneau.desassignerEnseignant();
            affectationRepository.save(creneau);
        }
        if (!creneauxNonEffectues.isEmpty()) {
            log.info("Créneaux désassignés suite à la suspension : enseignantId={}, count={}",
                    id, creneauxNonEffectues.size());
        }

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

    @Override
    public FicheAncienneteEnseignant consulterAnciennete(UUID enseignantId) {
        Enseignant enseignant = recupererEnseignant(enseignantId);
        LocalDate dateRecrutement = enseignant.getDateRecrutement() != null
                ? enseignant.getDateRecrutement()
                : LocalDate.now();
        LocalDate now = LocalDate.now();
        Period period = Period.between(dateRecrutement, now);
        int annees = Math.max(0, period.getYears());
        int mois = Math.max(0, period.getMonths());

        List<AffectationDepartementale> rosters = rosterRepository.findByEnseignantId(enseignantId);
        List<Affectation> affectations = affectationRepository.findByEnseignantId(enseignantId);

        Set<UUID> sessionIds = new LinkedHashSet<>();
        rosters.forEach(r -> sessionIds.add(r.getSessionId()));
        affectations.forEach(a -> sessionIds.add(a.getSessionId()));

        Map<UUID, List<AffectationDepartementale>> rostersParSession = rosters.stream()
                .collect(Collectors.groupingBy(AffectationDepartementale::getSessionId));
        Map<UUID, List<Affectation>> affectationsParSession = affectations.stream()
                .collect(Collectors.groupingBy(Affectation::getSessionId));

        List<ResumeSessionEnseignant> historiqueSessions = new ArrayList<>();

        for (UUID sId : sessionIds) {
            SessionAcademique session = sessionRepository.findById(sId).orElse(null);
            if (session == null) continue;

            List<AffectationDepartementale> rosterSession = rostersParSession.getOrDefault(sId, List.of());
            List<String> nomsDepartements = rosterSession.stream()
                    .map(r -> departementRepository.findById(r.getDepartementId()).map(Departement::getNom).orElse("Inconnu"))
                    .distinct()
                    .toList();

            List<Affectation> affSession = affectationsParSession.getOrDefault(sId, List.of());
            int seancesTotales = affSession.size();
            int seancesEffectuees = (int) affSession.stream()
                    .filter(a -> a.getStatut() == StatutAffectation.EFFECTUEE)
                    .count();

            historiqueSessions.add(new ResumeSessionEnseignant(
                    session.getId(),
                    session.getAnnee(),
                    session.getStatut(),
                    nomsDepartements,
                    seancesEffectuees,
                    seancesTotales,
                    enseignant.getCoutParSeance()
            ));
        }

        historiqueSessions.sort((a, b) -> {
            SessionAcademique sA = sessionRepository.findById(a.sessionId()).orElse(null);
            SessionAcademique sB = sessionRepository.findById(b.sessionId()).orElse(null);
            if (sA != null && sB != null) {
                return sB.getDateDebut().compareTo(sA.getDateDebut());
            }
            return 0;
        });

        int nombreSessionsActives = sessionIds.size();

        return new FicheAncienneteEnseignant(
                enseignant.getId(),
                enseignant.getNom(),
                enseignant.getPrenom(),
                enseignant.getMatricule(),
                enseignant.getStatut(),
                dateRecrutement,
                annees,
                mois,
                nombreSessionsActives,
                historiqueSessions
        );
    }
}