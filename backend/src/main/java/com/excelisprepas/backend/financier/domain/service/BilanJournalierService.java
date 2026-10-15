package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.*;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import lombok.extern.slf4j.Slf4j;

import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;

import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.model.Salle;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
public class BilanJournalierService implements SoumettreBilanCaissierUseCase, ValiderBilanChefCentreUseCase,
        ValiderBilanControleurUseCase, ConsulterBilanDuJourUseCase, ConsulterRepartitionParFormationUseCase,
        ConsulterBilanConsolideDuJourUseCase, AjusterActiviteBilanUseCase {

    private final BilanJournalierRepositoryPort bilanRepository;
    private final EntreeRepositoryPort entreeRepository;
    private final SortieRepositoryPort sortieRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final CentreRepositoryPort centreRepository;
    private final UtilisateurRepositoryPort utilisateurRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final PersonnelRepositoryPort personnelRepository;
    private final AffectationRepositoryPort affectationRepository;
    private final FormationRepositoryPort formationRepository;
    private final MotifRepositoryPort motifRepository;
    private final com.excelisprepas.backend.shared.audit.application.AuditEventHelper auditEventHelper;
    private final SalleRepositoryPort salleRepository;

    public BilanJournalierService(BilanJournalierRepositoryPort bilanRepository,
                                  EntreeRepositoryPort entreeRepository,
                                  SortieRepositoryPort sortieRepository,
                                  ApprenantRepositoryPort apprenantRepository,
                                  CentreRepositoryPort centreRepository,
                                  UtilisateurRepositoryPort utilisateurRepository,
                                  SessionAcademiqueRepositoryPort sessionRepository) {
        this(bilanRepository, entreeRepository, sortieRepository, apprenantRepository,
                centreRepository, utilisateurRepository, sessionRepository, null, null, null, null, null);
    }

    public BilanJournalierService(BilanJournalierRepositoryPort bilanRepository,
                                  EntreeRepositoryPort entreeRepository,
                                  SortieRepositoryPort sortieRepository,
                                  ApprenantRepositoryPort apprenantRepository,
                                  CentreRepositoryPort centreRepository,
                                  UtilisateurRepositoryPort utilisateurRepository,
                                  SessionAcademiqueRepositoryPort sessionRepository,
                                  PersonnelRepositoryPort personnelRepository,
                                  AffectationRepositoryPort affectationRepository) {
        this(bilanRepository, entreeRepository, sortieRepository, apprenantRepository,
                centreRepository, utilisateurRepository, sessionRepository, personnelRepository, affectationRepository, null, null, null);
    }

    public BilanJournalierService(BilanJournalierRepositoryPort bilanRepository,
                                  EntreeRepositoryPort entreeRepository,
                                  SortieRepositoryPort sortieRepository,
                                  ApprenantRepositoryPort apprenantRepository,
                                  CentreRepositoryPort centreRepository,
                                  UtilisateurRepositoryPort utilisateurRepository,
                                  SessionAcademiqueRepositoryPort sessionRepository,
                                  PersonnelRepositoryPort personnelRepository,
                                  AffectationRepositoryPort affectationRepository,
                                  FormationRepositoryPort formationRepository,
                                  MotifRepositoryPort motifRepository) {
        this(bilanRepository, entreeRepository, sortieRepository, apprenantRepository,
                centreRepository, utilisateurRepository, sessionRepository, personnelRepository, affectationRepository,
                formationRepository, motifRepository, null);
    }

    public BilanJournalierService(BilanJournalierRepositoryPort bilanRepository,
                                  EntreeRepositoryPort entreeRepository,
                                  SortieRepositoryPort sortieRepository,
                                  ApprenantRepositoryPort apprenantRepository,
                                  CentreRepositoryPort centreRepository,
                                  UtilisateurRepositoryPort utilisateurRepository,
                                  SessionAcademiqueRepositoryPort sessionRepository,
                                  PersonnelRepositoryPort personnelRepository,
                                  AffectationRepositoryPort affectationRepository,
                                  FormationRepositoryPort formationRepository,
                                  MotifRepositoryPort motifRepository,
                                  com.excelisprepas.backend.shared.audit.application.AuditEventHelper auditEventHelper) {
        this(bilanRepository, entreeRepository, sortieRepository, apprenantRepository,
                centreRepository, utilisateurRepository, sessionRepository, personnelRepository, affectationRepository,
                formationRepository, motifRepository, auditEventHelper, null);
    }

    public BilanJournalierService(BilanJournalierRepositoryPort bilanRepository,
                                  EntreeRepositoryPort entreeRepository,
                                  SortieRepositoryPort sortieRepository,
                                  ApprenantRepositoryPort apprenantRepository,
                                  CentreRepositoryPort centreRepository,
                                  UtilisateurRepositoryPort utilisateurRepository,
                                  SessionAcademiqueRepositoryPort sessionRepository,
                                  PersonnelRepositoryPort personnelRepository,
                                  AffectationRepositoryPort affectationRepository,
                                  FormationRepositoryPort formationRepository,
                                  MotifRepositoryPort motifRepository,
                                  com.excelisprepas.backend.shared.audit.application.AuditEventHelper auditEventHelper,
                                  SalleRepositoryPort salleRepository) {
        this.bilanRepository = bilanRepository;
        this.entreeRepository = entreeRepository;
        this.sortieRepository = sortieRepository;
        this.apprenantRepository = apprenantRepository;
        this.centreRepository = centreRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.sessionRepository = sessionRepository;
        this.personnelRepository = personnelRepository;
        this.affectationRepository = affectationRepository;
        this.formationRepository = formationRepository;
        this.motifRepository = motifRepository;
        this.auditEventHelper = auditEventHelper;
        this.salleRepository = salleRepository;
    }

    private SessionAcademique verifierSessionUtilisable(UUID sessionId) {
        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            log.warn("Opération refusée : session {} clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }
        return session;
    }

    private String recupererNomCompletUtilisateur(UUID utilisateurId) {
        if (personnelRepository != null && utilisateurId != null) {
            return personnelRepository.findById(utilisateurId)
                    .map(Personnel::getNomComplet)
                    .orElse(null);
        }
        return null;
    }

    private TotauxCentreJour calculerTotaux(UUID centreId, UUID sessionId, LocalDate date) {
        List<Entree> entrees = new ArrayList<>();
        entrees.addAll(entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.VALIDE));
        entrees.addAll(entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.EN_ATTENTE));

        List<Sortie> sorties = new ArrayList<>();
        sorties.addAll(sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.VALIDE));
        sorties.addAll(sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.EN_ATTENTE));

        BigDecimal totalEntrees = entrees.stream().map(Entree::getMontant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSorties = sorties.stream().map(Sortie::getMontant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netAVerser = totalEntrees.subtract(totalSorties);

        long effectifNouveauxEleves = 0;
        long effectifTotalCentre = 0;
        if (apprenantRepository != null) {
            effectifNouveauxEleves = apprenantRepository.countByCentreIdAndSessionIdAndDateInscription(centreId, sessionId, date);
            effectifTotalCentre = apprenantRepository.countByCentreIdAndSessionId(centreId, sessionId);
        }

        int nombreCours = 0;
        int nombreSalles = 0;
        if (affectationRepository != null) {
            Optional<SessionAcademique> sessionOpt = sessionRepository.findById(sessionId);
            if (sessionOpt.isPresent()) {
                SessionAcademique session = sessionOpt.get();
                long joursEcoules = ChronoUnit.DAYS.between(session.getDateDebut(), date);
                int semaine = Math.max(1, (int) (joursEcoules / 7) + 1);
                Jour jour = convertirJour(date.getDayOfWeek());
                if (jour != null) {
                    List<Affectation> affectations = affectationRepository.findBySessionIdAndCentreIdAndSemaine(sessionId, centreId, semaine);
                    if (affectations.isEmpty() && semaine != 1) {
                        affectations = affectationRepository.findBySessionIdAndCentreIdAndSemaine(sessionId, centreId, 1);
                    }
                    List<Affectation> duJour = affectations.stream().filter(a -> a.getJour() == jour).toList();

                    // Priorité 1 : cours validés du jour (marqués comme EFFECTUEE par le Chef de Centre)
                    List<Affectation> coursValides = duJour.stream()
                            .filter(a -> a.getStatut() == com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation.EFFECTUEE)
                            .toList();
                    if (!coursValides.isEmpty()) {
                        nombreCours = coursValides.size();
                        nombreSalles = (int) coursValides.stream().map(Affectation::getSalleId).filter(Objects::nonNull).distinct().count();
                    } else {
                        // Priorité 2 : cours prévus / planifiés du jour
                        List<Affectation> coursPlanifies = duJour.stream()
                                .filter(a -> a.getStatut() != com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation.ANNULEE)
                                .toList();
                        if (!coursPlanifies.isEmpty()) {
                            nombreCours = coursPlanifies.size();
                            nombreSalles = (int) coursPlanifies.stream().map(Affectation::getSalleId).filter(Objects::nonNull).distinct().count();
                        }
                    }
                }
            }
        }

        // Si aucune salle n'a été déduite du planning pour ce jour (ex: jour sans cours ou dimanche),
        // on consulte le référentiel des salles physiques du centre pour la session
        if (nombreSalles == 0 && salleRepository != null) {
            List<Salle> salles = salleRepository.findByCentreIdAndSessionId(centreId, sessionId);
            if (salles.isEmpty()) {
                salles = salleRepository.findByCentreId(centreId);
            }
            if (!salles.isEmpty()) {
                nombreSalles = salles.size();
            }
        }

        return new TotauxCentreJour(totalEntrees, totalSorties, netAVerser,
                (int) effectifNouveauxEleves, (int) effectifTotalCentre, nombreSalles, nombreCours);
    }

    private static Jour convertirJour(DayOfWeek dayOfWeek) {
        return switch (dayOfWeek) {
            case MONDAY -> Jour.LUNDI;
            case TUESDAY -> Jour.MARDI;
            case WEDNESDAY -> Jour.MERCREDI;
            case THURSDAY -> Jour.JEUDI;
            case FRIDAY -> Jour.VENDREDI;
            case SATURDAY -> Jour.SAMEDI;
            default -> null;
        };
    }

    @Override
    public BilanJournalier soumettreBilanCaissier(UUID centreId, UUID sessionId, LocalDate date, UUID caissierUtilisateurId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        verifierSessionUtilisable(sessionId);
        if (utilisateurRepository.findById(caissierUtilisateurId).isEmpty()) {
            throw new UtilisateurIntrouvableException(caissierUtilisateurId);
        }

        String nomCaissier = recupererNomCompletUtilisateur(caissierUtilisateurId);
        Optional<BilanJournalier> existant = bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date);

        BilanJournalier bilan;
        if (existant.isPresent()) {
            bilan = existant.get();
            bilan.soumettreCaissier(caissierUtilisateurId, nomCaissier, LocalDateTime.now());
        } else {
            bilan = BilanJournalier.creerPourCaissier(UUID.randomUUID(), centreId, sessionId, date,
                    caissierUtilisateurId, nomCaissier, LocalDateTime.now());
        }

        bilan = bilanRepository.save(bilan);
        log.info("Bilan journalier soumis par le caissier : id={}, centreId={}, date={}", bilan.getId(), centreId, date);
        if (auditEventHelper != null) {
            auditEventHelper.audit(
                    com.excelisprepas.backend.shared.audit.domain.event.AuditModule.BILAN_JOURNALIER,
                    "VISA_CAISSIER",
                    "Visa caissier apposé pour le bilan du " + date + " (par " + (nomCaissier != null ? nomCaissier : caissierUtilisateurId) + ")",
                    "BilanJournalier",
                    bilan.getId().toString(),
                    java.util.Map.of("bilanId", bilan.getId().toString(), "date", date.toString(), "nomCaissier", nomCaissier != null ? nomCaissier : ""),
                    centreId
            );
        }
        return bilan;
    }

    @Override
    public BilanJournalier validerBilanChefCentre(UUID centreId, UUID sessionId, LocalDate date, UUID validateurUtilisateurId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        verifierSessionUtilisable(sessionId);
        if (utilisateurRepository.findById(validateurUtilisateurId).isEmpty()) {
            throw new UtilisateurIntrouvableException(validateurUtilisateurId);
        }

        String nomChefCentre = recupererNomCompletUtilisateur(validateurUtilisateurId);
        Optional<BilanJournalier> existant = bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date);
        if (existant.isPresent() && existant.get().getStatut() != StatutBilan.SOUMIS_CAISSIER) {
            log.warn("Validation de bilan refusée : bilan déjà existant pour centreId={}, date={}", centreId, date);
            throw new BilanJournalierDejaExistantException(centreId, date);
        }

        BilanJournalier bilan;
        if (existant.isPresent()) {
            bilan = existant.get();
            bilan.validerChefCentre(validateurUtilisateurId, nomChefCentre, LocalDateTime.now());
        } else {
            bilan = new BilanJournalier(UUID.randomUUID(), centreId, sessionId, date);
            bilan.validerChefCentre(validateurUtilisateurId, nomChefCentre, LocalDateTime.now());
        }

        bilan = bilanRepository.save(bilan);
        log.info("Bilan journalier validé par le chef de centre : id={}, centreId={}, date={}", bilan.getId(), centreId, date);
        if (auditEventHelper != null) {
            auditEventHelper.audit(
                    com.excelisprepas.backend.shared.audit.domain.event.AuditModule.BILAN_JOURNALIER,
                    "VISA_CHEF_CENTRE",
                    "Visa chef de centre validé pour le bilan du " + date + " (par " + (nomChefCentre != null ? nomChefCentre : validateurUtilisateurId) + ")",
                    "BilanJournalier",
                    bilan.getId().toString(),
                    java.util.Map.of("bilanId", bilan.getId().toString(), "date", date.toString(), "nomChefCentre", nomChefCentre != null ? nomChefCentre : ""),
                    centreId
            );
        }
        return bilan;
    }

    @Override
    public BilanJournalier validerBilanControleur(UUID bilanId, UUID validateurUtilisateurId) {
        BilanJournalier bilan = bilanRepository.findById(bilanId)
                .orElseThrow(() -> new BilanJournalierIntrouvableException(bilanId));

        verifierSessionUtilisable(bilan.getSessionId());
        if (utilisateurRepository.findById(validateurUtilisateurId).isEmpty()) {
            throw new UtilisateurIntrouvableException(validateurUtilisateurId);
        }

        String nomControleur = recupererNomCompletUtilisateur(validateurUtilisateurId);
        TotauxCentreJour totaux = calculerTotaux(bilan.getCentreId(), bilan.getSessionId(), bilan.getDate());
        int nbSallesFinal = (bilan.getNombreSalles() != null && bilan.getNombreSalles() > 0) ? bilan.getNombreSalles() : totaux.nombreSalles();
        int nbCoursFinal = (bilan.getNombreCours() != null && bilan.getNombreCours() > 0) ? bilan.getNombreCours() : totaux.nombreCours();

        bilan.cloturer(validateurUtilisateurId, nomControleur, LocalDateTime.now(),
                totaux.totalEntrees(), totaux.totalSorties(),
                totaux.effectifNouveauxEleves(), totaux.effectifTotalCentre(),
                nbSallesFinal, nbCoursFinal);
        bilanRepository.save(bilan);

        List<Entree> entrees = entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(
                bilan.getCentreId(), bilan.getSessionId(), bilan.getDate(), StatutMouvement.VALIDE);
        for (Entree entree : entrees) {
            entree.rattacherABilan(bilan.getId());
            entreeRepository.save(entree);
        }

        List<Sortie> sorties = sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(
                bilan.getCentreId(), bilan.getSessionId(), bilan.getDate(), StatutMouvement.VALIDE);
        for (Sortie sortie : sorties) {
            sortie.rattacherABilan(bilan.getId());
            sortieRepository.save(sortie);
        }

        log.info("Bilan journalier validé par le contrôleur : id={}", bilanId);
        if (auditEventHelper != null) {
            auditEventHelper.audit(
                    com.excelisprepas.backend.shared.audit.domain.event.AuditModule.BILAN_JOURNALIER,
                    "CLOTURE_BILAN",
                    "Clôture et visa contrôleur du bilan du " + bilan.getDate() + " (par " + (nomControleur != null ? nomControleur : validateurUtilisateurId) + ")",
                    "BilanJournalier",
                    bilan.getId().toString(),
                    java.util.Map.of("bilanId", bilan.getId().toString(), "date", bilan.getDate().toString(), "totalEntrees", totaux.totalEntrees(), "totalSorties", totaux.totalSorties()),
                    bilan.getCentreId()
            );
        }
        return bilan;
    }

    @Override
    public BilanJournalier ajusterActivite(UUID centreId, UUID sessionId, LocalDate date,
                                           int nombreSalles, int nombreCours, UUID utilisateurId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        verifierSessionUtilisable(sessionId);

        Optional<BilanJournalier> existant = bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date);
        BilanJournalier bilan;
        if (existant.isPresent()) {
            bilan = existant.get();
            bilan.ajusterActivite(nombreSalles, nombreCours);
        } else {
            bilan = new BilanJournalier(UUID.randomUUID(), centreId, sessionId, date);
            bilan.ajusterActivite(nombreSalles, nombreCours);
        }
        bilan = bilanRepository.save(bilan);
        log.info("Activité du bilan journalier ajustée : centreId={}, date={}, salles={}, cours={}", centreId, date, nombreSalles, nombreCours);
        return bilan;
    }

    @Override
    public BilanJournalierApercu consulterBilanDuJour(UUID centreId, UUID sessionId, LocalDate date) {
        Optional<BilanJournalier> existant = bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date);

        if (existant.isPresent() && existant.get().getStatut() == StatutBilan.CLOTURE) {
            BilanJournalier bilan = existant.get();
            int nbSalles = (bilan.getNombreSalles() != null) ? bilan.getNombreSalles() : 0;
            int nbCours = (bilan.getNombreCours() != null) ? bilan.getNombreCours() : 0;

            return new BilanJournalierApercu(bilan.getId(), bilan.getStatut(), bilan.getTotalEntrees(),
                    bilan.getTotalSorties(), bilan.getNetAVerser(), bilan.getEffectifNouveauxEleves(),
                    bilan.getEffectifTotalCentre(),
                    nbSalles,
                    nbCours,
                    bilan.getDateVisaCaissier(), bilan.getNomCaissier(),
                    bilan.getDateValidationChefCentre(), bilan.getNomChefCentre(),
                    bilan.getDateValidationControleur(), bilan.getNomControleur());
        }

        TotauxCentreJour totaux = calculerTotaux(centreId, sessionId, date);

        UUID idExistant = existant.map(BilanJournalier::getId).orElse(null);
        StatutBilan statutExistant = existant.map(BilanJournalier::getStatut).orElse(null);

        int nbSallesFinal = existant.map(BilanJournalier::getNombreSalles)
                .filter(n -> n != null && n > 0)
                .orElse(totaux.nombreSalles());
        int nbCoursFinal = existant.map(BilanJournalier::getNombreCours)
                .filter(n -> n != null && n > 0)
                .orElse(totaux.nombreCours());

        return new BilanJournalierApercu(idExistant, statutExistant, totaux.totalEntrees(), totaux.totalSorties(),
                totaux.netAVerser(), totaux.effectifNouveauxEleves(), totaux.effectifTotalCentre(),
                nbSallesFinal, nbCoursFinal,
                existant.map(BilanJournalier::getDateVisaCaissier).orElse(null),
                existant.map(BilanJournalier::getNomCaissier).orElse(null),
                existant.map(BilanJournalier::getDateValidationChefCentre).orElse(null),
                existant.map(BilanJournalier::getNomChefCentre).orElse(null),
                null, null);
    }

    @Override
    public List<RepartitionFormationLigne> consulterRepartitionParFormation(UUID bilanId) {
        if (bilanRepository.findById(bilanId).isEmpty()) {
            throw new BilanJournalierIntrouvableException(bilanId);
        }

        List<Entree> entrees = entreeRepository.findByBilanJournalierId(bilanId);
        Map<UUID, BigDecimal> parFormation = new HashMap<>();
        for (Entree entree : entrees) {
            UUID formationId = entree.getFormationId().orElse(null);
            parFormation.merge(formationId, entree.getMontant(), BigDecimal::add);
        }

        return parFormation.entrySet().stream()
                .map(entry -> new RepartitionFormationLigne(entry.getKey(), entry.getValue()))
                .toList();
    }

    @Override
    public BilanConsolideNational consulterBilanConsolide(UUID sessionId, LocalDate date) {
        verifierSessionUtilisable(sessionId);

        List<com.excelisprepas.backend.centre.domain.model.Centre> tousLesCentres = centreRepository.findAll();

        Map<UUID, String> nomsFormations = new HashMap<>();
        if (formationRepository != null) {
            formationRepository.findAll().forEach(f -> nomsFormations.put(f.getId(), f.getNom()));
        }

        Map<UUID, String> nomsMotifs = new HashMap<>();
        if (motifRepository != null) {
            motifRepository.findAll().forEach(m -> nomsMotifs.put(m.getId(), m.getNom()));
        }

        List<BilanCentreResume> centresResumes = new ArrayList<>();
        BigDecimal totalEntreesNational = BigDecimal.ZERO;
        BigDecimal totalSortiesNational = BigDecimal.ZERO;
        long totalNouveauxElevesNational = 0;
        long totalEffectifNational = 0;
        int centresCloturesCount = 0;

        Map<String, LigneEntreeResume> mapEntreesNationales = new LinkedHashMap<>();
        Map<UUID, LigneSortieResume> mapSortiesNationales = new LinkedHashMap<>();
        Map<UUID, EffectifFormationResume> mapEffectifsNationaux = new LinkedHashMap<>();

        for (com.excelisprepas.backend.centre.domain.model.Centre centre : tousLesCentres) {
            BilanJournalierApercu apercu = consulterBilanDuJour(centre.getId(), sessionId, date);

            totalEntreesNational = totalEntreesNational.add(apercu.totalEntrees());
            totalSortiesNational = totalSortiesNational.add(apercu.totalSorties());
            totalNouveauxElevesNational += apercu.effectifNouveauxEleves();
            totalEffectifNational += apercu.effectifTotalCentre();
            if (apercu.statut() == StatutBilan.CLOTURE) {
                centresCloturesCount++;
            }

            // Entrées du centre
            List<Entree> entrees = new ArrayList<>();
            entrees.addAll(entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(centre.getId(), sessionId, date, StatutMouvement.VALIDE));
            entrees.addAll(entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(centre.getId(), sessionId, date, StatutMouvement.EN_ATTENTE));

            Map<String, LigneEntreeResume> mapEntreesCentre = new LinkedHashMap<>();
            for (Entree e : entrees) {
                String cle;
                String cat;
                UUID formId = e.getFormationId().orElse(null);
                String lib;
                if (formId != null) {
                    cat = "FORMATION";
                    cle = "FORMATION_" + formId;
                    lib = nomsFormations.getOrDefault(formId, "Formation");
                } else {
                    cat = "AUTRE";
                    cle = "AUTRE_" + e.getMotifId();
                    lib = nomsMotifs.getOrDefault(e.getMotifId(), "Autre encaissement");
                }
                LigneEntreeResume existante = mapEntreesCentre.get(cle);
                if (existante == null) {
                    mapEntreesCentre.put(cle, new LigneEntreeResume(cat, formId, lib, e.getMontant(), 1));
                } else {
                    mapEntreesCentre.put(cle, new LigneEntreeResume(cat, formId, lib, existante.montant().add(e.getMontant()), existante.nombreOperations() + 1));
                }

                LigneEntreeResume existanteNat = mapEntreesNationales.get(cle);
                if (existanteNat == null) {
                    mapEntreesNationales.put(cle, new LigneEntreeResume(cat, formId, lib, e.getMontant(), 1));
                } else {
                    mapEntreesNationales.put(cle, new LigneEntreeResume(cat, formId, lib, existanteNat.montant().add(e.getMontant()), existanteNat.nombreOperations() + 1));
                }
            }

            // Sorties du centre
            List<Sortie> sorties = new ArrayList<>();
            sorties.addAll(sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(centre.getId(), sessionId, date, StatutMouvement.VALIDE));
            sorties.addAll(sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(centre.getId(), sessionId, date, StatutMouvement.EN_ATTENTE));

            Map<UUID, LigneSortieResume> mapSortiesCentre = new LinkedHashMap<>();
            for (Sortie s : sorties) {
                UUID mId = s.getMotifId();
                String lib = nomsMotifs.getOrDefault(mId, "Dépense");
                LigneSortieResume existante = mapSortiesCentre.get(mId);
                if (existante == null) {
                    mapSortiesCentre.put(mId, new LigneSortieResume(mId, lib, s.getMontant(), 1));
                } else {
                    mapSortiesCentre.put(mId, new LigneSortieResume(mId, lib, existante.montant().add(s.getMontant()), existante.nombreOperations() + 1));
                }

                LigneSortieResume existanteNat = mapSortiesNationales.get(mId);
                if (existanteNat == null) {
                    mapSortiesNationales.put(mId, new LigneSortieResume(mId, lib, s.getMontant(), 1));
                } else {
                    mapSortiesNationales.put(mId, new LigneSortieResume(mId, lib, existanteNat.montant().add(s.getMontant()), existanteNat.nombreOperations() + 1));
                }
            }

            // Effectifs du centre par formation
            Map<UUID, EffectifFormationResume> mapEffectifsCentre = new LinkedHashMap<>();
            if (apprenantRepository != null) {
                List<com.excelisprepas.backend.apprenant.domain.model.Apprenant> apprenants =
                        apprenantRepository.findByCentreIdAndSessionId(centre.getId(), sessionId);
                for (com.excelisprepas.backend.apprenant.domain.model.Apprenant a : apprenants) {
                    UUID fId = a.getFormationId();
                    if (fId != null) {
                        String fNom = nomsFormations.getOrDefault(fId, "Formation");
                        boolean isNouveau = a.getDateInscription() != null && a.getDateInscription().equals(date);
                        EffectifFormationResume eff = mapEffectifsCentre.get(fId);
                        if (eff == null) {
                            mapEffectifsCentre.put(fId, new EffectifFormationResume(fId, fNom, isNouveau ? 1 : 0, 1));
                        } else {
                            mapEffectifsCentre.put(fId, new EffectifFormationResume(fId, fNom,
                                    eff.nouveauxElevesJour() + (isNouveau ? 1 : 0),
                                    eff.effectifTotal() + 1));
                        }

                        EffectifFormationResume effNat = mapEffectifsNationaux.get(fId);
                        if (effNat == null) {
                            mapEffectifsNationaux.put(fId, new EffectifFormationResume(fId, fNom, isNouveau ? 1 : 0, 1));
                        } else {
                            mapEffectifsNationaux.put(fId, new EffectifFormationResume(fId, fNom,
                                    effNat.nouveauxElevesJour() + (isNouveau ? 1 : 0),
                                    effNat.effectifTotal() + 1));
                        }
                    }
                }
            }

            centresResumes.add(new BilanCentreResume(
                    centre.getId(),
                    centre.getNom(),
                    recupererVilleCentre(centre),
                    apercu.statut(),
                    apercu.totalEntrees(),
                    apercu.totalSorties(),
                    apercu.netAVerser(),
                    apercu.effectifNouveauxEleves(),
                    apercu.effectifTotalCentre(),
                    apercu.nombreSalles(),
                    apercu.nombreCours(),
                    apercu.nomCaissier(),
                    apercu.dateVisaCaissier(),
                    apercu.nomChefCentre(),
                    apercu.dateValidationChefCentre(),
                    apercu.nomControleur(),
                    apercu.dateValidationControleur(),
                    new ArrayList<>(mapEntreesCentre.values()),
                    new ArrayList<>(mapSortiesCentre.values()),
                    new ArrayList<>(mapEffectifsCentre.values())
            ));
        }

        BigDecimal netAVerserNational = totalEntreesNational.subtract(totalSortiesNational);

        return new BilanConsolideNational(
                date,
                sessionId,
                totalEntreesNational,
                totalSortiesNational,
                netAVerserNational,
                totalNouveauxElevesNational,
                totalEffectifNational,
                centresCloturesCount,
                tousLesCentres.size(),
                centresResumes,
                new ArrayList<>(mapEntreesNationales.values()),
                new ArrayList<>(mapSortiesNationales.values()),
                new ArrayList<>(mapEffectifsNationaux.values())
        );
    }

    private String recupererVilleCentre(com.excelisprepas.backend.centre.domain.model.Centre centre) {
        try {
            return centre.getLocalisationActuelle().getVille();
        } catch (Exception e) {
            return "";
        }
    }
}