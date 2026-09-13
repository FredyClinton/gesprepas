package com.excelisprepas.backend.academie.concoursblanc.domain.port.out;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.EpreuveConcoursBlanc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EpreuveConcoursBlancRepositoryPort {
    EpreuveConcoursBlanc save(EpreuveConcoursBlanc epreuve);
    List<EpreuveConcoursBlanc> saveAll(List<EpreuveConcoursBlanc> epreuves);
    List<EpreuveConcoursBlanc> findByConcoursBlancId(UUID concoursBlancId);
    Optional<EpreuveConcoursBlanc> findById(UUID id);
    void deleteByConcoursBlancId(UUID concoursBlancId);
}

