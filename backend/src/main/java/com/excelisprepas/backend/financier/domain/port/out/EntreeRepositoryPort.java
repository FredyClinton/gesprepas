package com.excelisprepas.backend.financier.domain.port.out;

import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EntreeRepositoryPort {
    Entree save(Entree entree);

    Optional<Entree> findById(UUID id);

    List<Entree> findByApprenantId(UUID apprenantId);

    List<Entree> findByCentreIdAndSessionIdAndDateAndStatut(UUID centreId, UUID sessionId, LocalDate date, StatutMouvement statut);

    List<Entree> findByBilanJournalierId(UUID bilanJournalierId);
}