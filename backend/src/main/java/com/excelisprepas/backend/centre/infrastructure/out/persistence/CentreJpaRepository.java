package com.excelisprepas.backend.centre.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CentreJpaRepository extends JpaRepository<CentreEntity, UUID> {
}