package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttributionRoleJpaRepository extends JpaRepository<AttributionRoleEntity, UUID> {
    Optional<AttributionRoleEntity> findByUtilisateurIdAndSessionIdAndRole(
            UUID utilisateurId, UUID sessionId, RoleUtilisateur role);

    boolean existsByUtilisateurIdAndSessionIdAndRole(UUID utilisateurId, UUID sessionId, RoleUtilisateur role);

    List<AttributionRoleEntity> findByUtilisateurIdAndSessionId(UUID utilisateurId, UUID sessionId);
}