// dossier/domain/port/out/ConcoursRepositoryPort.java
package com.excelisprepas.backend.dossier.domain.port.out;

import com.excelisprepas.backend.dossier.domain.model.Concours;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConcoursRepositoryPort {
    Concours save(Concours concours);

    Optional<Concours> findById(UUID id);

    List<Concours> findBySessionId(UUID sessionId);
}