package com.excelisprepas.backend.inscription.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface DossierInscriptionJpaRepository extends JpaRepository<DossierInscriptionEntity, UUID> {
    List<DossierInscriptionEntity> findByApprenantIdAndSessionId(UUID apprenantId, UUID sessionId);
}

