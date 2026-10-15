package com.excelisprepas.backend.personnel.domain.port.out;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccesPersonnelRepositoryPort {

    AccesPersonnel save(AccesPersonnel accesPersonnel);

    Optional<AccesPersonnel> findById(UUID id);

    Optional<AccesPersonnel> findByPersonnelIdAndSessionIdAndPhaseId(UUID personnelId, UUID sessionId, UUID phaseId);

    List<AccesPersonnel> findByPersonnelIdAndSessionId(UUID personnelId, UUID sessionId);

    List<AccesPersonnel> findByPersonnelId(UUID personnelId);

    List<AccesPersonnel> findBySessionId(UUID sessionId);

    List<AccesPersonnel> findBySessionIdAndPhaseId(UUID sessionId, UUID phaseId);
}
