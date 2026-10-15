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

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
public class BilanJournalierService implements SoumettreBilanCaissierUseCase, ValiderBilanChefCentreUseCase,
        ValiderBilanControleurUseCase, ConsulterBilanDuJourUseCase, ConsulterRepartitionParFormationUseCase {

    private final BilanJournalierRepositoryPort bilanRepository;
    private final EntreeRepositoryPort entreeRepository;
    private final SortieRepositoryPort sortieRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final CentreRepositoryPort centreRepository;
    private final UtilisateurRepositoryPort utilisateurRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final PersonnelRepositoryPort personnelRepository;
    private final AffectationRepositoryPort affectationRepository;

    public BilanJournalierService(BilanJournalierRepositoryPort bilanRepository,
                                  EntreeRepositoryPort entreeRepository,
                                  SortieRepositoryPort sortieRepository,
                                  ApprenantRepositoryPort apprenantRepository,
                                  CentreRepositoryPort centreRepository,
                                  UtilisateurRepositoryPort utilisateurRepository,
                                  SessionAcademiqueRepositoryPort sessionRepository) {
        this(bilanRepository, entreeRepository, sortieRepository, apprenantRepository,
                centreRepository, utilisateurRepository, sessionRepository, null, null);
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
        this.bilanRepository = bilanRepository;
        this.entreeRepository = entreeRepository;
        this.sortieRepository = sortieRepository;
        this.apprenantRepository = apprenantRepository;
        this.centreRepository = centreRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.sessionRepository = sessionRepository;
        this.personnelRepository = personnelRepository;
        this.affectationRepository = affectationRepository;
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
                    List<Affectation> duJour = affectations.stream().filter(a -> a.getJour() == jour).toList();
                    nombreCours = duJour.size();
                    nombreSalles = (int) duJour.stream().map(Affectation::getSalleId).distinct().count();
                }
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

        bilan.cloturer(validateurUtilisateurId, nomControleur, LocalDateTime.now(),
                totaux.totalEntrees(), totaux.totalSorties(),
                totaux.effectifNouveauxEleves(), totaux.effectifTotalCentre(),
                totaux.nombreSalles(), totaux.nombreCours());
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
        return bilan;
    }

    @Override
    public BilanJournalierApercu consulterBilanDuJour(UUID centreId, UUID sessionId, LocalDate date) {
        Optional<BilanJournalier> existant = bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date);

        if (existant.isPresent() && existant.get().getStatut() == StatutBilan.CLOTURE) {
            BilanJournalier bilan = existant.get();
            return new BilanJournalierApercu(bilan.getId(), bilan.getStatut(), bilan.getTotalEntrees(),
                    bilan.getTotalSorties(), bilan.getNetAVerser(), bilan.getEffectifNouveauxEleves(),
                    bilan.getEffectifTotalCentre(),
                    bilan.getNombreSalles() != null ? bilan.getNombreSalles() : 0,
                    bilan.getNombreCours() != null ? bilan.getNombreCours() : 0,
                    bilan.getDateVisaCaissier(), bilan.getNomCaissier(),
                    bilan.getDateValidationChefCentre(), bilan.getNomChefCentre(),
                    bilan.getDateValidationControleur(), bilan.getNomControleur());
        }

        TotauxCentreJour totaux = calculerTotaux(centreId, sessionId, date);
        UUID idExistant = existant.map(BilanJournalier::getId).orElse(null);
        StatutBilan statutExistant = existant.map(BilanJournalier::getStatut).orElse(null);

        return new BilanJournalierApercu(idExistant, statutExistant, totaux.totalEntrees(), totaux.totalSorties(),
                totaux.netAVerser(), totaux.effectifNouveauxEleves(), totaux.effectifTotalCentre(),
                totaux.nombreSalles(), totaux.nombreCours(),
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
}