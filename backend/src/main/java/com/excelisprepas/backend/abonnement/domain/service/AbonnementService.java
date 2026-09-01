package com.excelisprepas.backend.abonnement.domain.service;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;
import com.excelisprepas.backend.abonnement.domain.port.in.AbonnerCentreFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.DesabonnerCentreFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.ListerCentresAbonnesParFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.ListerFormationsAbonneesParCentreUseCase;
import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
public class AbonnementService implements AbonnerCentreFormationUseCase, DesabonnerCentreFormationUseCase,
        ListerFormationsAbonneesParCentreUseCase, ListerCentresAbonnesParFormationUseCase {

    private final CentreFormationAbonnementRepositoryPort abonnementRepository;
    private final CentreRepositoryPort centreRepository;
    private final FormationRepositoryPort formationRepository;
    private final SalleRepositoryPort salleRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public AbonnementService(CentreFormationAbonnementRepositoryPort abonnementRepository,
                             CentreRepositoryPort centreRepository,
                             FormationRepositoryPort formationRepository,
                             SalleRepositoryPort salleRepository,
                             SessionAcademiqueRepositoryPort sessionRepository) {
        this.abonnementRepository = abonnementRepository;
        this.centreRepository = centreRepository;
        this.formationRepository = formationRepository;
        this.salleRepository = salleRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public CentreFormationAbonnement abonnerCentre(UUID centreId, UUID formationId, UUID sessionId) {
        Centre centre = centreRepository.findById(centreId)
                .orElseThrow(() -> new CentreIntrouvableException(centreId));
        formationRepository.findById(formationId)
                .orElseThrow(() -> new FormationIntrouvableException(formationId));

        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            log.warn("Abonnement refusé : la session {} est clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }

        if (!centre.getSessionIds().contains(sessionId)) {
            log.warn("Abonnement refusé : le centre {} n'a pas rejoint la session {}", centreId, sessionId);
            throw new CentreNonParticipantSessionException(centreId, sessionId);
        }

        if (abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)) {
            log.warn("Abonnement refusé : le centre {} est déjà abonné à la formation {} pour la session {}",
                    centreId, formationId, sessionId);
            throw new CentreDejaAbonneException(centreId, formationId);
        }

        CentreFormationAbonnement abonnement = new CentreFormationAbonnement(
                UUID.randomUUID(), centreId, formationId, sessionId, LocalDate.now());
        abonnement = abonnementRepository.save(abonnement);
        log.info("Centre {} abonné à la formation {} pour la session {} : abonnementId={}",
                centreId, formationId, sessionId, abonnement.getId());
        return abonnement;
    }

    @Override
    public void desabonnerCentre(UUID centreId, UUID formationId, UUID sessionId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        if (formationRepository.findById(formationId).isEmpty()) {
            throw new FormationIntrouvableException(formationId);
        }
        if (sessionRepository.findById(sessionId).isEmpty()) {
            throw new SessionIntrouvableException(sessionId);
        }
        if (!abonnementRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId)) {
            throw new AbonnementIntrouvableException(centreId, formationId);
        }

        boolean salleUtilisee = salleRepository.findByCentreIdAndSessionId(centreId, sessionId).stream()
                .anyMatch(salle -> formationId.equals(salle.getFormationId()));
        if (salleUtilisee) {
            log.warn("Désabonnement refusé : des salles du centre {} utilisent encore la formation {} pour la session {}",
                    centreId, formationId, sessionId);
            throw new IllegalStateException("Impossible de désabonner le centre : des salles y sont encore rattachées");
        }

        abonnementRepository.deleteByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId);
        log.info("Centre {} désabonné de la formation {} pour la session {}", centreId, formationId, sessionId);
    }

    @Override
    public List<Formation> listerFormationsAbonnees(UUID centreId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        List<CentreFormationAbonnement> abonnements = abonnementRepository.findByCentreId(centreId);
        return abonnements.stream()
                .map(a -> formationRepository.findById(a.getFormationId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .distinct()
                .toList();
    }

    @Override
    public List<Formation> listerFormationsAbonnees(UUID centreId, UUID sessionId) {
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        if (sessionRepository.findById(sessionId).isEmpty()) {
            throw new SessionIntrouvableException(sessionId);
        }
        List<CentreFormationAbonnement> abonnements = abonnementRepository.findByCentreIdAndSessionId(centreId, sessionId);
        return abonnements.stream()
                .map(a -> formationRepository.findById(a.getFormationId()))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .toList();
    }

    @Override
    public List<CentreFormationAbonnement> listerCentresAbonnes(UUID formationId) {
        if (formationRepository.findById(formationId).isEmpty()) {
            throw new FormationIntrouvableException(formationId);
        }
        return abonnementRepository.findByFormationId(formationId);
    }

    @Override
    public List<CentreFormationAbonnement> listerCentresAbonnes(UUID formationId, UUID sessionId) {
        if (formationRepository.findById(formationId).isEmpty()) {
            throw new FormationIntrouvableException(formationId);
        }
        if (sessionRepository.findById(sessionId).isEmpty()) {
            throw new SessionIntrouvableException(sessionId);
        }
        return abonnementRepository.findByFormationIdAndSessionId(formationId, sessionId);
    }
}
