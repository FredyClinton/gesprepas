package com.excelisprepas.backend.affectationdepartementale.infrastructure.out.persistence;

import com.excelisprepas.backend.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class AffectationDepartementaleRepositoryAdapter implements AffectationDepartementaleRepositoryPort {

    private final AffectationDepartementaleJpaRepository jpaRepository;
    private final AffectationDepartementalePersistenceMapper mapper;

    public AffectationDepartementaleRepositoryAdapter(AffectationDepartementaleJpaRepository jpaRepository,
                                                      AffectationDepartementalePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public AffectationDepartementale save(AffectationDepartementale entree) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(entree)));
    }

    @Override
    public Optional<AffectationDepartementale> findByEnseignantIdAndSessionIdAndDepartementId(
            UUID enseignantId, UUID sessionId, UUID departementId) {
        return jpaRepository.findByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId)
                .map(mapper::toDomain);
    }

    @Override
    public boolean existsByEnseignantIdAndSessionIdAndDepartementId(UUID enseignantId, UUID sessionId, UUID departementId) {
        return jpaRepository.existsByEnseignantIdAndSessionIdAndDepartementId(enseignantId, sessionId, departementId);
    }

    @Override
    public List<AffectationDepartementale> findByDepartementIdAndSessionId(UUID departementId, UUID sessionId) {
        return jpaRepository.findByDepartementIdAndSessionId(departementId, sessionId).stream()
                .map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}