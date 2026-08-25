package com.excelisprepas.backend.rattachement.domain.port.out;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttributionRoleRepositoryPort {
    AttributionRole save(AttributionRole attribution);

    Optional<AttributionRole> findByUtilisateurIdAndSessionIdAndRole(UUID utilisateurId, UUID sessionId, RoleUtilisateur role);

    boolean existsByUtilisateurIdAndSessionIdAndRole(UUID utilisateurId, UUID sessionId, RoleUtilisateur role);

    List<AttributionRole> findByUtilisateurIdAndSessionId(UUID utilisateurId, UUID sessionId);

    void deleteById(UUID id);
}