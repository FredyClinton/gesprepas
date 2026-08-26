package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MouvementFinancierJpaRepository extends JpaRepository<MouvementFinancierEntity, UUID> {
}