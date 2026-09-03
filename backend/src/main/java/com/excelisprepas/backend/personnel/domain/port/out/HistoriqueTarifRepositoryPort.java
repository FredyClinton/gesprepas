package com.excelisprepas.backend.personnel.domain.port.out;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueTarifEnseignant;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HistoriqueTarifRepositoryPort {
    HistoriqueTarifEnseignant save(HistoriqueTarifEnseignant historique);
    List<HistoriqueTarifEnseignant> findByEnseignantIdAndSessionId(UUID enseignantId, UUID sessionId);
    Optional<HistoriqueTarifEnseignant> findTarifApplicable(UUID enseignantId, UUID sessionId, int semaine);
}
