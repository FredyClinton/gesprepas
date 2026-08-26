package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.Concours;

import java.time.LocalDate;
import java.util.UUID;

public interface CreerConcoursUseCase {
    Concours creerConcours(String nom, UUID sessionId, LocalDate dateLimiteDepot, LocalDate dateLimiteRecevabiliteCentre);
}