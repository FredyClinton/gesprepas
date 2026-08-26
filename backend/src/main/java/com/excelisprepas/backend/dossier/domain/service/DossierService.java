package com.excelisprepas.backend.dossier.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.dossier.domain.model.*;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.dossier.domain.port.out.*;
import com.excelisprepas.backend.shared.exception.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class DossierService implements OuvrirDossierUseCase, RecupererDossierUseCase, RecupererDossierParApprenantUseCase,
        ModifierObservationUseCase, AjouterConcoursAuDossierUseCase, AjouterPieceADossierConcoursUseCase,
        ListerDossierConcoursUseCase, ListerPiecesDossierUseCase, ValiderPieceDeposeeUseCase,
        SignalerDossierCompletUseCase, CloturerDossierUseCase {

    private final DossierRepositoryPort dossierRepository;
    private final DossierConcoursRepositoryPort dossierConcoursRepository;
    private final PieceDossierRepositoryPort pieceDossierRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final ConcoursRepositoryPort concoursRepository;
    private final ConcoursPieceRequiseRepositoryPort concoursPieceRequiseRepository;
    private final PieceRequiseRepositoryPort pieceRequiseRepository;

    public DossierService(DossierRepositoryPort dossierRepository,
                          DossierConcoursRepositoryPort dossierConcoursRepository,
                          PieceDossierRepositoryPort pieceDossierRepository,
                          ApprenantRepositoryPort apprenantRepository,
                          ConcoursRepositoryPort concoursRepository,
                          ConcoursPieceRequiseRepositoryPort concoursPieceRequiseRepository,
                          PieceRequiseRepositoryPort pieceRequiseRepository) {
        this.dossierRepository = dossierRepository;
        this.dossierConcoursRepository = dossierConcoursRepository;
        this.pieceDossierRepository = pieceDossierRepository;
        this.apprenantRepository = apprenantRepository;
        this.concoursRepository = concoursRepository;
        this.concoursPieceRequiseRepository = concoursPieceRequiseRepository;
        this.pieceRequiseRepository = pieceRequiseRepository;
    }

    @Override
    public Dossier ouvrirDossier(UUID apprenantId) {
        Apprenant apprenant = apprenantRepository.findById(apprenantId)
                .orElseThrow(() -> new ApprenantIntrouvableException(apprenantId));
        if (dossierRepository.existsByApprenantId(apprenantId)) {
            throw new DossierDejaExistantException(apprenantId);
        }

        Dossier dossier = new Dossier(UUID.randomUUID(), apprenantId, apprenant.getCentreId(),
                apprenant.getSessionId(), LocalDate.now());
        return dossierRepository.save(dossier);
    }

    @Override
    public Dossier recupererDossier(UUID id) {
        return dossierRepository.findById(id)
                .orElseThrow(() -> new DossierIntrouvableException(id));
    }

    @Override
    public Dossier recupererDossierParApprenant(UUID apprenantId) {
        return dossierRepository.findByApprenantId(apprenantId)
                .orElseThrow(() -> new DossierIntrouvablePourApprenantException(apprenantId));
    }

    @Override
    public Dossier modifierObservation(UUID dossierId, String observation) {
        Dossier dossier = recupererDossier(dossierId);
        dossier.modifierObservation(observation);
        return dossierRepository.save(dossier);
    }

    @Override
    public DossierConcours ajouterConcoursAuDossier(UUID dossierId, UUID concoursId, List<SelectionPiece> selections) {
        Dossier dossier = recupererDossier(dossierId);
        if (!dossier.estOuvert()) {
            throw new DossierNonOuvertException(dossierId);
        }
        if (selections == null || selections.isEmpty()) {
            throw new IllegalArgumentException("Au moins une pièce doit être sélectionnée");
        }

        Concours concours = concoursRepository.findById(concoursId)
                .orElseThrow(() -> new ConcoursIntrouvableException(concoursId));
        if (!concours.estEncoreOuvert(LocalDate.now())) {
            throw new ConcoursDateLimiteDepasseeException(concoursId);
        }
        if (dossierConcoursRepository.existsByDossierIdAndConcoursId(dossierId, concoursId)) {
            throw new ConcoursDejaAjouteAuDossierException(dossierId, concoursId);
        }

        for (SelectionPiece selection : selections) {
            if (!concoursPieceRequiseRepository.existsByConcoursIdAndPieceRequiseId(concoursId, selection.pieceRequiseId())) {
                throw new PieceNonAjouteeAuConcoursException(concoursId, selection.pieceRequiseId());
            }
        }

        DossierConcours dossierConcours = new DossierConcours(UUID.randomUUID(), dossierId, concoursId,
                dossier.getCentreId(), dossier.getSessionId(), LocalDate.now());
        dossierConcours = dossierConcoursRepository.save(dossierConcours);

        for (SelectionPiece selection : selections) {
            PieceDossier pieceDossier = new PieceDossier(UUID.randomUUID(), dossierConcours.getId(),
                    selection.pieceRequiseId(), selection.quantite());
            pieceDossierRepository.save(pieceDossier);
        }

        return recalculerMontantTotal(dossierConcours);
    }

    @Override
    public PieceDossier ajouterPieceADossierConcours(UUID dossierConcoursId, UUID pieceRequiseId, int quantite) {
        DossierConcours dossierConcours = dossierConcoursRepository.findById(dossierConcoursId)
                .orElseThrow(() -> new DossierConcoursIntrouvableException(dossierConcoursId));

        Dossier dossier = recupererDossier(dossierConcours.getDossierId());
        if (!dossier.estOuvert()) {
            throw new DossierNonOuvertException(dossier.getId());
        }

        if (!concoursPieceRequiseRepository.existsByConcoursIdAndPieceRequiseId(dossierConcours.getConcoursId(), pieceRequiseId)) {
            throw new PieceNonAjouteeAuConcoursException(dossierConcours.getConcoursId(), pieceRequiseId);
        }

        PieceDossier pieceDossier = pieceDossierRepository
                .findByDossierConcoursIdAndPieceRequiseId(dossierConcoursId, pieceRequiseId)
                .orElse(null);

        if (pieceDossier != null) {
            pieceDossier.augmenterQuantite(quantite);
        } else {
            pieceDossier = new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, quantite);
        }
        pieceDossier = pieceDossierRepository.save(pieceDossier);

        recalculerMontantTotal(dossierConcours);

        return pieceDossier;
    }

    private DossierConcours recalculerMontantTotal(DossierConcours dossierConcours) {
        List<PieceDossier> pieces = pieceDossierRepository.findByDossierConcoursId(dossierConcours.getId());
        BigDecimal total = BigDecimal.ZERO;
        for (PieceDossier piece : pieces) {
            PieceRequise pieceRequise = pieceRequiseRepository.findById(piece.getPieceRequiseId())
                    .orElseThrow(() -> new PieceRequiseIntrouvableException(piece.getPieceRequiseId()));
            total = total.add(pieceRequise.getMontant().multiply(BigDecimal.valueOf(piece.getQuantite())));
        }
        dossierConcours.redefinirMontantTotal(total);
        return dossierConcoursRepository.save(dossierConcours);
    }

    @Override
    public List<DossierConcours> listerDossierConcours(UUID dossierId) {
        recupererDossier(dossierId);
        return dossierConcoursRepository.findByDossierId(dossierId);
    }

    @Override
    public List<PieceDossier> listerPiecesDossier(UUID dossierConcoursId) {
        if (dossierConcoursRepository.findById(dossierConcoursId).isEmpty()) {
            throw new DossierConcoursIntrouvableException(dossierConcoursId);
        }
        return pieceDossierRepository.findByDossierConcoursId(dossierConcoursId);
    }

    @Override
    public PieceDossier validerPieceDeposee(UUID pieceDossierId) {
        PieceDossier pieceDossier = pieceDossierRepository.findById(pieceDossierId)
                .orElseThrow(() -> new PieceDossierIntrouvableException(pieceDossierId));

        DossierConcours dossierConcours = dossierConcoursRepository.findById(pieceDossier.getDossierConcoursId())
                .orElseThrow(() -> new DossierConcoursIntrouvableException(pieceDossier.getDossierConcoursId()));
        Dossier dossier = recupererDossier(dossierConcours.getDossierId());
        if (dossier.getStatut() == StatutDossier.CLOTURE) {
            throw new DossierClotureException(dossier.getId());
        }

        pieceDossier.valider(LocalDate.now());
        return pieceDossierRepository.save(pieceDossier);
    }

    @Override
    public Dossier signalerDossierComplet(UUID dossierId) {
        Dossier dossier = recupererDossier(dossierId);
        if (!dossier.estOuvert()) {
            throw new DossierNonOuvertException(dossierId);
        }

        List<DossierConcours> concoursAssocies = dossierConcoursRepository.findByDossierId(dossierId);
        if (concoursAssocies.isEmpty()) {
            throw new DossierSansConcoursException(dossierId);
        }

        for (DossierConcours dossierConcours : concoursAssocies) {
            List<PieceDossier> pieces = pieceDossierRepository.findByDossierConcoursId(dossierConcours.getId());
            boolean toutesValidees = pieces.stream().allMatch(piece -> piece.getStatut() == StatutPieceDossier.VALIDEE);
            if (!toutesValidees) {
                throw new PiecesNonToutesValideesException(dossierId);
            }
        }

        dossier.marquerComplet();
        return dossierRepository.save(dossier);
    }

    @Override
    public Dossier cloturerDossier(UUID dossierId) {
        Dossier dossier = recupererDossier(dossierId);
        dossier.cloturer(LocalDate.now());
        return dossierRepository.save(dossier);
    }
}