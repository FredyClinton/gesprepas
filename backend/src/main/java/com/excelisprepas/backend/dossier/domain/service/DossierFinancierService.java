package com.excelisprepas.backend.dossier.domain.service;

import com.excelisprepas.backend.dossier.domain.model.*;
import com.excelisprepas.backend.dossier.domain.port.in.ConsulterSoldeDossierConcoursUseCase;
import com.excelisprepas.backend.dossier.domain.port.in.EnregistrerPaiementDossierUseCase;
import com.excelisprepas.backend.dossier.domain.port.in.ObtenirStatistiquesDossiersUseCase;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.DossierConcoursRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.DossierRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.shared.exception.ConcoursIntrouvableException;
import com.excelisprepas.backend.shared.exception.DossierConcoursIntrouvableException;
import com.excelisprepas.backend.shared.exception.DossierIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
public class DossierFinancierService implements EnregistrerPaiementDossierUseCase,
        ConsulterSoldeDossierConcoursUseCase, ObtenirStatistiquesDossiersUseCase {

    private final DossierConcoursRepositoryPort dossierConcoursRepository;
    private final DossierRepositoryPort dossierRepository;
    private final ConcoursRepositoryPort concoursRepository;
    private final SaisirEntreeUseCase saisirEntreeUseCase;
    private final EntreeRepositoryPort entreeRepository;

    public DossierFinancierService(DossierConcoursRepositoryPort dossierConcoursRepository,
                                   DossierRepositoryPort dossierRepository,
                                   ConcoursRepositoryPort concoursRepository,
                                   SaisirEntreeUseCase saisirEntreeUseCase,
                                   EntreeRepositoryPort entreeRepository) {
        this.dossierConcoursRepository = dossierConcoursRepository;
        this.dossierRepository = dossierRepository;
        this.concoursRepository = concoursRepository;
        this.saisirEntreeUseCase = saisirEntreeUseCase;
        this.entreeRepository = entreeRepository;
    }

    @Override
    public Entree enregistrerPaiementDossier(UUID dossierConcoursId, UUID motifId, BigDecimal montant,
                                             LocalDate date, UUID saisiParUtilisateurId) {
        DossierConcours dossierConcours = dossierConcoursRepository.findById(dossierConcoursId)
                .orElseThrow(() -> new DossierConcoursIntrouvableException(dossierConcoursId));
        Dossier dossier = dossierRepository.findById(dossierConcours.getDossierId())
                .orElseThrow(() -> new DossierIntrouvableException(dossierConcours.getDossierId()));

        Entree entree = saisirEntreeUseCase.saisirEntree(dossierConcours.getSessionId(), motifId, montant, date,
                saisiParUtilisateurId, dossierConcours.getCentreId(), dossier.getApprenantId(), dossierConcoursId);
        log.info("Paiement de dossier enregistré : dossierConcoursId={}, montant={}", dossierConcoursId, montant);
        return entree;
    }

    @Override
    public SoldeDossierConcours consulterSolde(UUID dossierConcoursId) {
        DossierConcours dossierConcours = dossierConcoursRepository.findById(dossierConcoursId)
                .orElseThrow(() -> new DossierConcoursIntrouvableException(dossierConcoursId));

        BigDecimal montantPaye = entreeRepository.findByDossierConcoursId(dossierConcoursId).stream()
                .map(Entree::getMontant)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal soldeRestant = dossierConcours.getMontantTotal().subtract(montantPaye);

        return new SoldeDossierConcours(dossierConcoursId, dossierConcours.getMontantTotal(), montantPaye, soldeRestant);
    }

    @Override
    public List<StatistiqueDossierParCentre> obtenirStatistiques(UUID concoursId, UUID sessionId) {
        Concours concours = concoursRepository.findById(concoursId)
                .orElseThrow(() -> new ConcoursIntrouvableException(concoursId));

        List<DossierConcours> tousLesDossiersConcours = dossierConcoursRepository
                .findByConcoursIdAndSessionId(concours.getId(), sessionId);

        Map<UUID, Long> parCentre = tousLesDossiersConcours.stream()
                .collect(Collectors.groupingBy(
                        dossierConcours -> dossierConcours.getCentreId(),
                        Collectors.counting()
                ));

        return parCentre.entrySet().stream()
                .map(entry -> new StatistiqueDossierParCentre(entry.getKey(), entry.getValue()))
                .toList();
    }
}