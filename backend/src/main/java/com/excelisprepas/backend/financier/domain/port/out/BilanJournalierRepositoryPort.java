package com.excelisprepas.backend.financier.domain.port.out;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface BilanJournalierRepositoryPort {
    BilanJournalier save(BilanJournalier bilan);

    Optional<BilanJournalier> findById(UUID id);

    Optional<BilanJournalier> findByCentreIdAndSessionIdAndDate(UUID centreId, UUID sessionId, LocalDate date);
}