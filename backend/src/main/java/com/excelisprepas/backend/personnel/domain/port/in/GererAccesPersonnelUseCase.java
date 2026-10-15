package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;
import com.excelisprepas.backend.personnel.domain.model.StatutAcces;

import java.util.UUID;

public interface GererAccesPersonnelUseCase {

    AccesPersonnel definirAcces(UUID personnelId, UUID sessionId, UUID phaseId, StatutAcces statut, String motif);

    AccesPersonnel accorderAcces(UUID personnelId, UUID sessionId, UUID phaseId, String motif);

    AccesPersonnel bloquerAcces(UUID personnelId, UUID sessionId, UUID phaseId, String motif);
}
