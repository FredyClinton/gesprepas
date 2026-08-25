package com.excelisprepas.backend.affectationdepartementale.domain.service;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.AjouterEnseignantUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.CopierDepuisSessionUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.ListerRosterUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.RetirerEnseignantUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;

public class AffectationDepartementaleService implements AjouterEnseignantUseCase, RetirerEnseignantUseCase,
        CopierDepuisSessionUseCase, ListerRosterUseCase {

    private final AffectationDepartementaleRepositoryPort rosterRepository;
    private final DepartementRepositoryPort departementRepository;
    private final EnseignantRepositoryPort enseignantRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public AffectationDepartementaleService(AffectationDepartementaleRepositoryPort rosterRepository,
                                            DepartementRepositoryPort departementRepository,
                                            EnseignantRepositoryPort enseignantRepository,
                                            SessionAcademiqueRepositoryPort sessionRepository) {
        this.rosterRepository = rosterRepository;
        this.departementRepository = departementRepository;
        this.enseignantRepository = enseignantRepository;
        this.sessionRepository = sessionRepository;
    }

    private SessionAcademique verifierSessionUtilisable(UUID sessionId) {
        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            throw new SessionNonUtilisableException(sessionId);
        }
        return session;
    }

    @Override
    public AffectationDepartementale ajouterEnseignant(UUID departementId, UUID sessionId, UUID enseignantId) {
        if (departementRepository.findById(departementId).isEmpty()) {
            throw new DepartementIntrouvableException(departementId);
        }
        if (enseignantRepository.findById(enseignantId).isEmpty()) {
            throw new EnseignantIntrouvableException(enseignantId);
        }
        verifierSessionUtilisable(sessionId);
        if (rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId)) {
            throw new EnseignantDejaDansRosterException(enseignantId, sessionId, departementId);
        }

        AffectationDepartementale entree = new AffectationDepartementale(
                UUID.randomUUID(), enseignantId, sessionId, departementId);
        return rosterRepository.save(entree);
    }

    @Override
    public void retirerEnseignant(UUID departementId, UUID sessionId, UUID enseignantId) {
        AffectationDepartementale entree = rosterRepository
                .findByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId)
                .orElseThrow(() -> new AffectationDepartementaleIntrouvableException(enseignantId, sessionId, departementId));
        rosterRepository.deleteById(entree.getId());
    }

    @Override
    public List<AffectationDepartementale> copierDepuisSession(UUID departementId, UUID sessionSourceId,
                                                               UUID sessionCibleId, Set<UUID> enseignantIdsSelectionnes) {
        if (departementRepository.findById(departementId).isEmpty()) {
            throw new DepartementIntrouvableException(departementId);
        }
        if (sessionRepository.findById(sessionSourceId).isEmpty()) {
            throw new SessionIntrouvableException(sessionSourceId);
        }
        verifierSessionUtilisable(sessionCibleId);

        List<AffectationDepartementale> resultat = new ArrayList<>();
        for (UUID enseignantId : enseignantIdsSelectionnes) {
            if (!rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionSourceId, departementId)) {
                throw new EnseignantNonDansRosterSourceException(enseignantId, sessionSourceId, departementId);
            }
            if (rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionCibleId, departementId)) {
                continue; // déjà présent dans la session cible — idempotent
            }
            resultat.add(rosterRepository.save(new AffectationDepartementale(
                    UUID.randomUUID(), enseignantId, sessionCibleId, departementId)));
        }
        return resultat;
    }

    @Override
    public List<AffectationDepartementale> listerParDepartementEtSession(UUID departementId, UUID sessionId) {
        return rosterRepository.findByDepartementIdAndSessionId(departementId, sessionId);
    }
}