package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class MouvementFinancierService implements SaisirEntreeUseCase, SaisirSortieUseCase {

    private final EntreeRepositoryPort entreeRepository;
    private final SortieRepositoryPort sortieRepository;
    private final MotifRepositoryPort motifRepository;
    private final CentreRepositoryPort centreRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public MouvementFinancierService(EntreeRepositoryPort entreeRepository,
                                     SortieRepositoryPort sortieRepository,
                                     MotifRepositoryPort motifRepository,
                                     CentreRepositoryPort centreRepository,
                                     ApprenantRepositoryPort apprenantRepository,
                                     SessionAcademiqueRepositoryPort sessionRepository) {
        this.entreeRepository = entreeRepository;
        this.sortieRepository = sortieRepository;
        this.motifRepository = motifRepository;
        this.centreRepository = centreRepository;
        this.apprenantRepository = apprenantRepository;
        this.sessionRepository = sessionRepository;
    }

    private Motif verifierMotif(UUID motifId, TypeMotif typeAttendu) {
        Motif motif = motifRepository.findById(motifId)
                .orElseThrow(() -> new MotifIntrouvableException(motifId));
        if (!motif.isActif()) {
            throw new MotifInactifException(motifId);
        }
        if (motif.getType() != typeAttendu) {
            throw new MotifTypeIncorrectException(motifId, typeAttendu, motif.getType());
        }
        return motif;
    }

    private void verifierSessionUtilisable(UUID sessionId) {
        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            throw new SessionNonUtilisableException(sessionId);
        }
    }

    @Override
    public Entree saisirEntree(UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                               UUID saisiParUtilisateurId, UUID centreId, UUID apprenantId) {
        verifierMotif(motifId, TypeMotif.ENTREE);
        verifierSessionUtilisable(sessionId);
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }

        UUID formationId = null;
        if (apprenantId != null) {
            Apprenant apprenant = apprenantRepository.findById(apprenantId)
                    .orElseThrow(() -> new ApprenantIntrouvableException(apprenantId));
            formationId = apprenant.getFormationId();
        }

        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, montant, date,
                saisiParUtilisateurId, centreId, apprenantId, formationId);
        return entreeRepository.save(entree);
    }

    @Override
    public Sortie saisirSortie(UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                               UUID saisiParUtilisateurId, UUID centreId, String ordonnateur) {
        verifierMotif(motifId, TypeMotif.SORTIE);
        verifierSessionUtilisable(sessionId);
        if (centreId != null && centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }

        Sortie sortie = new Sortie(UUID.randomUUID(), sessionId, motifId, montant, date,
                saisiParUtilisateurId, centreId, ordonnateur);
        return sortieRepository.save(sortie);
    }
}