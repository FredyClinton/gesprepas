package com.excelisprepas.backend.academie.concoursblanc.domain.port.out;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.ConcoursBlanc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConcoursBlancRepositoryPort {
    ConcoursBlanc save(ConcoursBlanc concoursBlanc);
    Optional<ConcoursBlanc> findById(UUID id);
    List<ConcoursBlanc> findBySessionId(UUID sessionId);
    Optional<ConcoursBlanc> findPreviousConcours(UUID sessionId, int currentNumero);
    void deleteById(UUID id);
}

