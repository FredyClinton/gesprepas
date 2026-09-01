package com.excelisprepas.backend.academie.formation.domain.port.in;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;

import java.util.Set;
import java.util.UUID;

public interface CreerFormationUseCase {
    Formation creerFormation(String nom);

    Formation creerFormation(String nom, Set<UUID> matiereIds);
}
