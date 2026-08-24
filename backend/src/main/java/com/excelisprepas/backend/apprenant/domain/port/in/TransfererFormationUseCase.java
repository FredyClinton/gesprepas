package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;

import java.util.UUID;

public interface TransfererFormationUseCase {
    Apprenant transfererFormation(UUID apprenantId, UUID nouvelleFormationId);
}