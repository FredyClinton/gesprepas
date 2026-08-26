package com.excelisprepas.backend.financier.domain.port.out;

import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SortieRepositoryPort {
    Sortie save(Sortie sortie);

    Optional<Sortie> findById(UUID id);

    List<Sortie> findByCentreIdAndSessionIdAndDateAndStatut(UUID centreId, UUID sessionId, LocalDate date, StatutMouvement statut);
}