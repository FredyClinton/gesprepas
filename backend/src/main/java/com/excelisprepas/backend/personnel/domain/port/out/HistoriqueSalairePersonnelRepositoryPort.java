package com.excelisprepas.backend.personnel.domain.port.out;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HistoriqueSalairePersonnelRepositoryPort {
    HistoriqueSalairePersonnel save(HistoriqueSalairePersonnel historique);
    Optional<HistoriqueSalairePersonnel> findDernierSalaireApplicable(UUID personnelId, UUID sessionId, LocalDate datePaiement);
    List<HistoriqueSalairePersonnel> findByPersonnelIdAndSessionId(UUID personnelId, UUID sessionId);
    List<HistoriqueSalairePersonnel> findBySessionId(UUID sessionId);
}
