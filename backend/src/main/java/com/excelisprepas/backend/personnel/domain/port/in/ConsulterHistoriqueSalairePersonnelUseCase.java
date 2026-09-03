package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;

import java.util.List;
import java.util.UUID;

public interface ConsulterHistoriqueSalairePersonnelUseCase {
    List<HistoriqueSalairePersonnel> listerParPersonnelEtSession(UUID personnelId, UUID sessionId);
    List<HistoriqueSalairePersonnel> listerParSession(UUID sessionId);
}
