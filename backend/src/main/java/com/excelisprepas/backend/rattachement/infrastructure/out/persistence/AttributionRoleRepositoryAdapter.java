package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import com.excelisprepas.backend.rattachement.domain.port.out.AttributionRoleRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class AttributionRoleRepositoryAdapter implements AttributionRoleRepositoryPort {

    private final AttributionRoleJpaRepository jpaRepository;
    private final AttributionRolePersistenceMapper mapper;

    public AttributionRoleRepositoryAdapter(AttributionRoleJpaRepository jpaRepository,
                                            AttributionRolePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public AttributionRole save(AttributionRole attribution) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(attribution)));
    }

    @Override
    public Optional<AttributionRole> findByUtilisateurIdAndSessionIdAndRole(
            UUID utilisateurId, UUID sessionId, RoleUtilisateur role) {
        return jpaRepository.findByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, role)
                .map(mapper::toDomain);
    }

    @Override
    public boolean existsByUtilisateurIdAndSessionIdAndRole(UUID utilisateurId, UUID sessionId, RoleUtilisateur role) {
        return jpaRepository.existsByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, role);
    }

    @Override
    public List<AttributionRole> findByUtilisateurIdAndSessionId(UUID utilisateurId, UUID sessionId) {
        return jpaRepository.findByUtilisateurIdAndSessionId(utilisateurId, sessionId).stream()
                .map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}