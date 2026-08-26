package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.Entree;

import java.util.List;
import java.util.UUID;

public interface ListerVersementsApprenantUseCase {
    List<Entree> listerVersementsApprenant(UUID apprenantId);
}