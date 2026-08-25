package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
import com.excelisprepas.backend.rattachement.domain.port.out.RattachementCentreRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class RattachementCentreRepositoryAdapter implements RattachementCentreRepositoryPort {

    private final RattachementCentreJpaRepository jpaRepository;
    private final RattachementCentrePersistenceMapper mapper;

    public RattachementCentreRepositoryAdapter(RattachementCentreJpaRepository jpaRepository,
                                               RattachementCentrePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public RattachementCentre save(RattachementCentre rattachement) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(rattachement)));
    }

    @Override
    public Optional<RattachementCentre> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public boolean existsByUtilisateurIdAndSessionId(UUID utilisateurId, UUID sessionId) {
        return jpaRepository.existsByUtilisateurIdAndSessionId(utilisateurId, sessionId);
    }

    @Override
    public List<RattachementCentre> findByCentreIdAndSessionId(UUID centreId, UUID sessionId) {
        return jpaRepository.findByCentreIdAndSessionId(centreId, sessionId).stream()
                .map(mapper::toDomain).toList();
    }

    @Override
    public boolean existsByCentreId(UUID centreId) {
        return jpaRepository.existsByCentreId(centreId);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}