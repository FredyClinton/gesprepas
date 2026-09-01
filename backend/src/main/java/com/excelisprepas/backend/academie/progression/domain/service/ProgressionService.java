package com.excelisprepas.backend.academie.progression.domain.service;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.model.Progression;
import com.excelisprepas.backend.academie.progression.domain.port.in.*;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@Slf4j
public class ProgressionService implements CreerProgressionUseCase, RecupererProgressionUseCase,
        ListerProgressionsUseCase, MettreAJourContenuUseCase, SupprimerProgressionUseCase {

    private final ProgressionRepositoryPort progressionRepository;
    private final FormationRepositoryPort formationRepository;
    private final MatiereRepositoryPort matiereRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public ProgressionService(ProgressionRepositoryPort progressionRepository,
                              FormationRepositoryPort formationRepository,
                              MatiereRepositoryPort matiereRepository,
                              SessionAcademiqueRepositoryPort sessionRepository) {
        this.progressionRepository = progressionRepository;
        this.formationRepository = formationRepository;
        this.matiereRepository = matiereRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public Progression creerProgression(UUID formationId, UUID sessionId, UUID phaseId, UUID matiereId, int semaine, int numeroCours,
                                        String theme, String contenu, String exercices) {
        Formation formation = formationRepository.findById(formationId)
                .orElseThrow(() -> new FormationIntrouvableException(formationId));
        if (matiereRepository.findById(matiereId).isEmpty()) {
            throw new MatiereIntrouvableException(matiereId);
        }

        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            log.warn("Création de progression refusée : session {} clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }
        if (!formation.contientMatiere(matiereId)) {
            log.warn("Création de progression refusée : matière {} non au programme de la formation {}", matiereId, formationId);
            throw new MatiereNonAuProgrammeException(formationId, matiereId);
        }

        if (progressionRepository.existsByFormationIdAndSessionIdAndPhaseIdAndMatiereIdAndSemaineAndNumeroCours(
                formationId, sessionId, phaseId, matiereId, semaine, numeroCours)) {
            log.warn("Création de progression refusée : numéro de cours {} déjà utilisé pour formationId={}, sessionId={}, phaseId={}, matiereId={}, semaine={}",
                    numeroCours, formationId, sessionId, phaseId, matiereId, semaine);
            throw new NumeroCoursDejaUtiliseException(formationId, matiereId, semaine, numeroCours);
        }

        Progression progression = new Progression(
                UUID.randomUUID(), formationId, sessionId, phaseId, matiereId, semaine, numeroCours, theme, contenu, exercices);

        progression = progressionRepository.save(progression);
        log.info("Progression créée : id={}, formationId={}, matiereId={}, semaine={}, numeroCours={}",
                progression.getId(), formationId, matiereId, semaine, numeroCours);
        return progression;
    }

    @Override
    public Progression recupererProgression(UUID id) {
        return progressionRepository.findById(id)
                .orElseThrow(() -> new ProgressionIntrouvableException(id));
    }

    @Override
    public List<Progression> listerProgressions() {
        return progressionRepository.findAll();
    }

    @Override
    public Progression mettreAJourContenu(UUID id, String theme, String contenu, String exercices) {
        Progression progression = recupererProgression(id);
        progression.mettreAJourContenu(theme, contenu, exercices);
        progression = progressionRepository.save(progression);
        log.info("Contenu de progression mis à jour : id={}", id);
        return progression;
    }

    @Override
    public void supprimerProgression(UUID id) {
        recupererProgression(id);
        progressionRepository.deleteById(id);
        log.info("Progression supprimée : id={}", id);
    }
}