package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface BilanJournalierJpaRepository extends JpaRepository<BilanJournalierEntity, UUID> {
    Optional<BilanJournalierEntity> findByCentreIdAndSessionIdAndDate(UUID centreId, UUID sessionId, LocalDate date);
}