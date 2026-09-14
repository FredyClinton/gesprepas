package com.excelisprepas.backend.academie.quota.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.quota.domain.model.QuotaHebdomadaire;
import com.excelisprepas.backend.academie.quota.domain.port.out.QuotaHebdomadaireRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class QuotaHebdomadaireRepositoryAdapter implements QuotaHebdomadaireRepositoryPort {

    private final QuotaHebdomadaireJpaRepository jpaRepository;
    private final QuotaHebdomadairePersistenceMapper mapper;

    public QuotaHebdomadaireRepositoryAdapter(QuotaHebdomadaireJpaRepository jpaRepository,
                                              QuotaHebdomadairePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public QuotaHebdomadaire save(QuotaHebdomadaire quota) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(quota)));
    }

    @Override
    public Optional<QuotaHebdomadaire> findByFormationIdAndSessionIdAndMatiereIdAndSemaine(
            UUID formationId, UUID sessionId, UUID matiereId, int semaine) {
        return jpaRepository.findByFormationIdAndSessionIdAndMatiereIdAndSemaine(formationId, sessionId, matiereId, semaine)
                .map(mapper::toDomain);
    }

    @Override
    public List<QuotaHebdomadaire> findByFormationIdAndSessionId(UUID formationId, UUID sessionId) {
        return jpaRepository.findByFormationIdAndSessionId(formationId, sessionId).stream()
                .map(mapper::toDomain)
                .toList();
    }
}
