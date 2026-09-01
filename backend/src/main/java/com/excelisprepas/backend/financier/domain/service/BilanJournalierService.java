package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.*;
import com.excelisprepas.backend.financier.domain.port.in.ConsulterBilanDuJourUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ConsulterRepartitionParFormationUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ValiderBilanChefCentreUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ValiderBilanControleurUseCase;
import com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
public class BilanJournalierService implements ValiderBilanChefCentreUseCase, ValiderBilanControleurUseCase,
        ConsulterBilanDuJourUseCase, ConsulterRepartitionParFormationUseCase {

    private final BilanJournalierRepositoryPort bilanRepository;
    private final EntreeRepositoryPort entreeRepository;
    private final SortieRepositoryPort sortieRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final CentreRepositoryPort centreRepository;
    private final UtilisateurRepositoryPort utilisateurRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public BilanJournalierService(BilanJournalierRepositoryPort bilanRepository,
                                  EntreeRepositoryPort entreeRepository,
                                  SortieRepositoryPort sortieRepository,
                                  ApprenantRepositoryPort apprenantRepository,
                                  CentreRepositoryPort centreRepository,
                                  UtilisateurRepositoryPort utilisateurRepository,
                                  SessionAcademiqueRepositoryPort sessionRepository) {
        this.bilanRepository = bilanRepository;
        this.entreeRepository = entreeRepository;
        this.sortieRepository = sortieRepository;
        this.apprenantRepository = apprenantRepository;
        this.centreRepository = centreRepository;
        this.utilisateurRepository = utilisateurRepository;
        this.sessionRepository = sessionRepository;
    }

    private void verifierSessionUtilisable(UUID sessionId) {
        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            log.warn("Opération refusée : session {} clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }
    }

    private TotauxCentreJour calculerTotaux(UUID centreId, UUID sessionId, LocalDate date) {
        List<Entree> entrees = entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(
                centreId, sessionId, date, StatutMouvement.VALIDE);
        List<Sortie> sorties = sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(
                centreId, sessionId, date, StatutMouvement.VALIDE);

        BigDecimal totalEntrees = entrees.stream().map(Entree::getMontant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalSorties = sorties.stream().map(Sortie::getMontant).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal netAVerser = totalEntrees.subtract(totalSorties);

        long effectifNouveauxEleves = 0; // TODO: implement properly using DossierInscription
        long effectifTotalCentre = 0; // TODO: implement properly using DossierInscription

        return new TotauxCentreJour(totalEntrees, totalSorties, netAVerser,
                (int) effectifNouveauxEleves, (int) effectifTotalCentre);
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
        if (bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date).isPresent()) {
            log.warn("Validation de bilan refusée : bilan déjà existant pour centreId={}, date={}", centreId, date);
            throw new BilanJournalierDejaExistantException(centreId, date);
        }

        BilanJournalier bilan = new BilanJournalier(UUID.randomUUID(), centreId, sessionId, date,
                LocalDateTime.now(), validateurUtilisateurId);
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

        TotauxCentreJour totaux = calculerTotaux(bilan.getCentreId(), bilan.getSessionId(), bilan.getDate());

        bilan.cloturer(validateurUtilisateurId, LocalDateTime.now(), totaux.totalEntrees(), totaux.totalSorties(),
                totaux.effectifNouveauxEleves(), totaux.effectifTotalCentre());
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
                    bilan.getEffectifTotalCentre());
        }

        TotauxCentreJour totaux = calculerTotaux(centreId, sessionId, date);
        UUID idExistant = existant.map(BilanJournalier::getId).orElse(null);
        StatutBilan statutExistant = existant.map(BilanJournalier::getStatut).orElse(null);
        return new BilanJournalierApercu(idExistant, statutExistant, totaux.totalEntrees(), totaux.totalSorties(),
                totaux.netAVerser(), totaux.effectifNouveauxEleves(), totaux.effectifTotalCentre());
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