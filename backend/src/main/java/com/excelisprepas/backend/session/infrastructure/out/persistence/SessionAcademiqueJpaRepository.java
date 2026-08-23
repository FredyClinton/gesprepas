package com.excelisprepas.backend.session.infrastructure.out.persistence;


import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface SessionAcademiqueJpaRepository extends JpaRepository<SessionAcademiqueEntity, UUID> {
}