package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.*;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MouvementFinancierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class MouvementFinancierService implements SaisirEntreeUseCase, SaisirSortieUseCase,
        RecupererMouvementUseCase, ListerMouvementsUseCase, ListerVersementsApprenantUseCase {

    private final EntreeRepositoryPort entreeRepository;
    private final SortieRepositoryPort sortieRepository;
    private final MotifRepositoryPort motifRepository;
    private final CentreRepositoryPort centreRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final MouvementFinancierRepositoryPort mouvementRepository;

    public MouvementFinancierService(EntreeRepositoryPort entreeRepository,
                                     SortieRepositoryPort sortieRepository,
                                     MotifRepositoryPort motifRepository,
                                     CentreRepositoryPort centreRepository,
                                     ApprenantRepositoryPort apprenantRepository,
                                     SessionAcademiqueRepositoryPort sessionRepository,
                                     MouvementFinancierRepositoryPort mouvementRepository) {
        this.entreeRepository = entreeRepository;
        this.sortieRepository = sortieRepository;
        this.motifRepository = motifRepository;
        this.centreRepository = centreRepository;
        this.apprenantRepository = apprenantRepository;
        this.sessionRepository = sessionRepository;
        this.mouvementRepository = mouvementRepository;
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
                               UUID saisiParUtilisateurId, UUID centreId, UUID apprenantId, UUID dossierConcoursId) {
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
                saisiParUtilisateurId, centreId, apprenantId, formationId, dossierConcoursId);
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

    @Override
    public MouvementFinancier recupererMouvement(UUID id) {
        return mouvementRepository.findById(id)
                .orElseThrow(() -> new MouvementFinancierIntrouvableException(id));
    }

    @Override
    public List<MouvementFinancier> listerMouvements(UUID sessionId, UUID centreId, StatutMouvement statut) {
        List<Entree> entrees;
        List<Sortie> sorties;

        if (centreId != null && statut != null) {
            entrees = entreeRepository.findBySessionIdAndCentreIdAndStatut(sessionId, centreId, statut);
            sorties = sortieRepository.findBySessionIdAndCentreIdAndStatut(sessionId, centreId, statut);
        } else if (centreId != null) {
            entrees = entreeRepository.findBySessionIdAndCentreId(sessionId, centreId);
            sorties = sortieRepository.findBySessionIdAndCentreId(sessionId, centreId);
        } else if (statut != null) {
            entrees = entreeRepository.findBySessionIdAndStatut(sessionId, statut);
            sorties = sortieRepository.findBySessionIdAndStatut(sessionId, statut);
        } else {
            entrees = entreeRepository.findBySessionId(sessionId);
            sorties = sortieRepository.findBySessionId(sessionId);
        }

        List<MouvementFinancier> resultat = new ArrayList<>();
        resultat.addAll(entrees);
        resultat.addAll(sorties);
        return resultat;
    }

    @Override
    public List<Entree> listerVersementsApprenant(UUID apprenantId) {
        if (apprenantRepository.findById(apprenantId).isEmpty()) {
            throw new ApprenantIntrouvableException(apprenantId);
        }
        return entreeRepository.findByApprenantId(apprenantId);
    }
}