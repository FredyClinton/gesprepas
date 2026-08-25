package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RattachementCentreJpaRepository extends JpaRepository<RattachementCentreEntity, UUID> {
    boolean existsByUtilisateurIdAndSessionId(UUID utilisateurId, UUID sessionId);

    List<RattachementCentreEntity> findByCentreIdAndSessionId(UUID centreId, UUID sessionId);

    boolean existsByCentreId(UUID centreId);
}