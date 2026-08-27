package com.excelisprepas.backend.session.infrastructure.out.persistence;


import com.excelisprepas.backend.session.domain.model.StatutSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SessionAcademiqueJpaRepository extends JpaRepository<SessionAcademiqueEntity, UUID> {
    Optional<SessionAcademiqueEntity> findByStatut(StatutSession statut);
}