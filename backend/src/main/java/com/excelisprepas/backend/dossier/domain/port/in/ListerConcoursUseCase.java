package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.Concours;

import java.util.List;
import java.util.UUID;

public interface ListerConcoursUseCase {
    List<Concours> listerConcours(UUID sessionId);
}