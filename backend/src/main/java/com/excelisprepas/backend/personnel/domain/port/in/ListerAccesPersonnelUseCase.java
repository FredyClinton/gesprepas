package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;

import java.util.List;
import java.util.UUID;

public interface ListerAccesPersonnelUseCase {

    List<AccesPersonnel> listerParSession(UUID sessionId);

    List<AccesPersonnel> listerParSessionEtPhase(UUID sessionId, UUID phaseId);

    List<AccesPersonnel> listerParPersonnelEtSession(UUID personnelId, UUID sessionId);

    List<AccesPersonnel> listerParPersonnel(UUID personnelId);
}
