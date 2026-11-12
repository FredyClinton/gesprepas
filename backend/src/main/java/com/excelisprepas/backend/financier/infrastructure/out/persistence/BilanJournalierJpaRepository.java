package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface BilanJournalierJpaRepository extends JpaRepository<BilanJournalierEntity, UUID> {
    Optional<BilanJournalierEntity> findByCentreIdAndSessionIdAndDate(UUID centreId, UUID sessionId, LocalDate date);

    // Verrou consultatif PostgreSQL, relâché automatiquement à la fin de la transaction.
    // Enveloppé dans un SELECT 1 : pg_advisory_xact_lock renvoie void, que Hibernate ne sait pas lire.
    @Query(value = "SELECT 1 FROM (SELECT pg_advisory_xact_lock(hashtextextended(:cle, 0))) AS verrou",
            nativeQuery = true)
    Integer verrouillerJournee(@Param("cle") String cle);
}