package com.excelisprepas.backend.abonnement.infrastructure.out.persistence;

import com.excelisprepas.backend.abonnement.domain.model.CentreFormationAbonnement;
import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class CentreFormationAbonnementRepositoryAdapter implements CentreFormationAbonnementRepositoryPort {

    private final CentreFormationAbonnementJpaRepository jpaRepository;
    private final CentreFormationAbonnementPersistenceMapper mapper;

    public CentreFormationAbonnementRepositoryAdapter(CentreFormationAbonnementJpaRepository jpaRepository,
                                                      CentreFormationAbonnementPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public CentreFormationAbonnement save(CentreFormationAbonnement abonnement) {
        CentreFormationAbonnementEntity entity = mapper.toEntity(abonnement);
        return mapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<CentreFormationAbonnement> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<CentreFormationAbonnement> findByCentreIdAndFormationIdAndSessionId(UUID centreId, UUID formationId, UUID sessionId) {
        return jpaRepository.findByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId).map(mapper::toDomain);
    }

    @Override
    public List<CentreFormationAbonnement> findByCentreId(UUID centreId) {
        return jpaRepository.findByCentreId(centreId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<CentreFormationAbonnement> findByCentreIdAndSessionId(UUID centreId, UUID sessionId) {
        return jpaRepository.findByCentreIdAndSessionId(centreId, sessionId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<CentreFormationAbonnement> findByFormationId(UUID formationId) {
        return jpaRepository.findByFormationId(formationId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<CentreFormationAbonnement> findByFormationIdAndSessionId(UUID formationId, UUID sessionId) {
        return jpaRepository.findByFormationIdAndSessionId(formationId, sessionId).stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<CentreFormationAbonnement> findAll() {
        return jpaRepository.findAll().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public boolean existsByCentreIdAndFormationIdAndSessionId(UUID centreId, UUID formationId, UUID sessionId) {
        return jpaRepository.existsByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId);
    }

    @Override
    public boolean existsByCentreId(UUID centreId) {
        return jpaRepository.existsByCentreId(centreId);
    }

    @Override
    public boolean existsByFormationId(UUID formationId) {
        return jpaRepository.existsByFormationId(formationId);
    }

    @Override
    public boolean existsBySessionId(UUID sessionId) {
        return jpaRepository.existsBySessionId(sessionId);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteByCentreIdAndFormationIdAndSessionId(UUID centreId, UUID formationId, UUID sessionId) {
        jpaRepository.deleteByCentreIdAndFormationIdAndSessionId(centreId, formationId, sessionId);
    }
}
