package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface DefinirSalairePersonnelUseCase {
    HistoriqueSalairePersonnel definirSalaire(UUID personnelId, UUID sessionId, BigDecimal salaireReference, LocalDate dateDebutEffet);
}
