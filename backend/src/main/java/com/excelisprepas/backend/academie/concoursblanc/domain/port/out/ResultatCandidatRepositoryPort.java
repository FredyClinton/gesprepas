package com.excelisprepas.backend.academie.concoursblanc.domain.port.out;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.ResultatCandidat;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ResultatCandidatRepositoryPort {
    ResultatCandidat save(ResultatCandidat resultat);
    List<ResultatCandidat> saveAll(List<ResultatCandidat> resultats);
    List<ResultatCandidat> findByConcoursBlancIdAndCentreId(UUID concoursBlancId, UUID centreId);
    List<ResultatCandidat> findByConcoursBlancIdAndFormationId(UUID concoursBlancId, UUID formationId);
    List<ResultatCandidat> findByConcoursBlancId(UUID concoursBlancId);
    Optional<ResultatCandidat> findByConcoursBlancIdAndApprenantId(UUID concoursBlancId, UUID apprenantId);
    void deleteByConcoursBlancId(UUID concoursBlancId);
}

