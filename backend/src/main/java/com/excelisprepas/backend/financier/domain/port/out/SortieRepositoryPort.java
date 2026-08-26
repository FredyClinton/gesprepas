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

    List<Sortie> findBySessionId(UUID sessionId);

    List<Sortie> findBySessionIdAndCentreId(UUID sessionId, UUID centreId);

    List<Sortie> findBySessionIdAndStatut(UUID sessionId, StatutMouvement statut);

    List<Sortie> findBySessionIdAndCentreIdAndStatut(UUID sessionId, UUID centreId, StatutMouvement statut);
}