package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PersonnelJpaRepository extends JpaRepository<PersonnelEntity, UUID> {
}
