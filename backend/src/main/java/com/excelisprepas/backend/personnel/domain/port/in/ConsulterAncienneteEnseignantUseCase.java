package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.FicheAncienneteEnseignant;

import java.util.UUID;

public interface ConsulterAncienneteEnseignantUseCase {
    FicheAncienneteEnseignant consulterAnciennete(UUID enseignantId);
}
