package com.excelisprepas.backend.dossier.domain.service;

import com.excelisprepas.backend.dossier.domain.model.Concours;
import com.excelisprepas.backend.dossier.domain.model.ConcoursPieceRequise;
import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursPieceRequiseRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.PieceRequiseRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
public class ConcoursService implements CreerConcoursUseCase, RecupererConcoursUseCase, ListerConcoursUseCase,
        AjouterPieceAuConcoursUseCase, RetirerPieceDuConcoursUseCase, ListerPiecesDuConcoursUseCase {

    private final ConcoursRepositoryPort concoursRepository;
    private final ConcoursPieceRequiseRepositoryPort associationRepository;
    private final PieceRequiseRepositoryPort pieceRequiseRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public ConcoursService(ConcoursRepositoryPort concoursRepository,
                           ConcoursPieceRequiseRepositoryPort associationRepository,
                           PieceRequiseRepositoryPort pieceRequiseRepository,
                           SessionAcademiqueRepositoryPort sessionRepository) {
        this.concoursRepository = concoursRepository;
        this.associationRepository = associationRepository;
        this.pieceRequiseRepository = pieceRequiseRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public Concours creerConcours(String nom, UUID sessionId, LocalDate dateLimiteDepot, LocalDate dateLimiteRecevabiliteCentre) {
        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            log.warn("Création de concours refusée : session {} clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }

        Concours concours = new Concours(UUID.randomUUID(), nom, sessionId, dateLimiteDepot, dateLimiteRecevabiliteCentre);
        concours = concoursRepository.save(concours);
        log.info("Concours créé : id={}, nom={}, sessionId={}", concours.getId(), nom, sessionId);
        return concours;
    }

    @Override
    public Concours recupererConcours(UUID id) {
        return concoursRepository.findById(id)
                .orElseThrow(() -> new ConcoursIntrouvableException(id));
    }

    @Override
    public List<Concours> listerConcours(UUID sessionId) {
        return concoursRepository.findBySessionId(sessionId);
    }

    @Override
    public ConcoursPieceRequise ajouterPieceAuConcours(UUID concoursId, UUID pieceRequiseId) {
        recupererConcours(concoursId); // vérifie l'existence

        PieceRequise pieceRequise = pieceRequiseRepository.findById(pieceRequiseId)
                .orElseThrow(() -> new PieceRequiseIntrouvableException(pieceRequiseId));
        if (!pieceRequise.isActif()) {
            log.warn("Ajout de pièce au concours refusé : pièce {} inactive", pieceRequiseId);
            throw new PieceRequiseInactiveException(pieceRequiseId);
        }

        if (associationRepository.existsByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId)) {
            log.warn("Ajout de pièce au concours refusé : pièce {} déjà ajoutée au concours {}", pieceRequiseId, concoursId);
            throw new PieceDejaAjouteeAuConcoursException(concoursId, pieceRequiseId);
        }

        ConcoursPieceRequise association = new ConcoursPieceRequise(UUID.randomUUID(), concoursId, pieceRequiseId);
        association = associationRepository.save(association);
        log.info("Pièce ajoutée au concours : concoursId={}, pieceRequiseId={}", concoursId, pieceRequiseId);
        return association;
    }

    @Override
    public void retirerPieceDuConcours(UUID concoursId, UUID pieceRequiseId) {
        ConcoursPieceRequise association = associationRepository
                .findByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId)
                .orElseThrow(() -> new PieceNonAjouteeAuConcoursException(concoursId, pieceRequiseId));
        associationRepository.deleteById(association.getId());
        log.info("Pièce retirée du concours : concoursId={}, pieceRequiseId={}", concoursId, pieceRequiseId);
    }

    @Override
    public List<PieceRequise> listerPiecesDuConcours(UUID concoursId) {
        recupererConcours(concoursId); // vérifie l'existence

        return associationRepository.findByConcoursId(concoursId).stream()
                .map(association -> pieceRequiseRepository.findById(association.getPieceRequiseId())
                        .orElseThrow(() -> new PieceRequiseIntrouvableException(association.getPieceRequiseId())))
                .toList();
    }
}