package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;


public interface ContratApprenantJpaRepository extends JpaRepository<ContratApprenantEntity, UUID> {
    List<ContratApprenantEntity> findByApprenantIdOrderByDateSignatureDesc(UUID apprenantId);
}

