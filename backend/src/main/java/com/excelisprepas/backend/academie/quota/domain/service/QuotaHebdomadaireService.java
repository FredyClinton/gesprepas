package com.excelisprepas.backend.academie.quota.domain.service;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.quota.domain.model.QuotaHebdomadaire;
import com.excelisprepas.backend.academie.quota.domain.port.in.DefinirQuotaUseCase;
import com.excelisprepas.backend.academie.quota.domain.port.in.ListerQuotasUseCase;
import com.excelisprepas.backend.academie.quota.domain.port.out.QuotaHebdomadaireRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatiereNonAuProgrammeException;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@Slf4j
public class QuotaHebdomadaireService implements DefinirQuotaUseCase, ListerQuotasUseCase {

    private final QuotaHebdomadaireRepositoryPort quotaRepository;
    private final FormationRepositoryPort formationRepository;
    private final MatiereRepositoryPort matiereRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;

    public QuotaHebdomadaireService(QuotaHebdomadaireRepositoryPort quotaRepository,
                                    FormationRepositoryPort formationRepository,
                                    MatiereRepositoryPort matiereRepository,
                                    SessionAcademiqueRepositoryPort sessionRepository) {
        this.quotaRepository = quotaRepository;
        this.formationRepository = formationRepository;
        this.matiereRepository = matiereRepository;
        this.sessionRepository = sessionRepository;
    }

    @Override
    public QuotaHebdomadaire definirQuota(UUID formationId, UUID sessionId, UUID matiereId, int semaine, int quota) {
        Formation formation = formationRepository.findById(formationId)
                .orElseThrow(() -> new FormationIntrouvableException(formationId));
        if (matiereRepository.findById(matiereId).isEmpty()) {
            throw new MatiereIntrouvableException(matiereId);
        }
        if (sessionRepository.findById(sessionId).isEmpty()) {
            throw new SessionIntrouvableException(sessionId);
        }
        if (!formation.contientMatiere(matiereId)) {
            throw new MatiereNonAuProgrammeException(formationId, matiereId);
        }

        QuotaHebdomadaire quotaExistant = quotaRepository
                .findByFormationIdAndSessionIdAndMatiereIdAndSemaine(formationId, sessionId, matiereId, semaine)
                .orElse(null);

        QuotaHebdomadaire resultat;
        if (quotaExistant != null) {
            quotaExistant.modifier(quota);
            resultat = quotaExistant;
        } else {
            resultat = new QuotaHebdomadaire(UUID.randomUUID(), formationId, sessionId, matiereId, semaine, quota);
        }

        resultat = quotaRepository.save(resultat);
        log.info("Quota hebdomadaire défini : formationId={}, sessionId={}, matiereId={}, semaine={}, quota={}",
                formationId, sessionId, matiereId, semaine, quota);
        return resultat;
    }

    @Override
    public List<QuotaHebdomadaire> listerQuotas(UUID formationId, UUID sessionId) {
        return quotaRepository.findByFormationIdAndSessionId(formationId, sessionId);
    }
}
