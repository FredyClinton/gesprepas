package com.excelisprepas.backend.dossier.domain.port.out;

import com.excelisprepas.backend.dossier.domain.model.DossierConcours;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DossierConcoursRepositoryPort {
    DossierConcours save(DossierConcours dossierConcours);

    Optional<DossierConcours> findById(UUID id);

    List<DossierConcours> findByDossierId(UUID dossierId);

    boolean existsByDossierIdAndConcoursId(UUID dossierId, UUID concoursId);

    List<DossierConcours> findByConcoursIdAndSessionId(UUID concoursId, UUID sessionId);
}