package com.excelisprepas.backend.academie.formation.domain.port.in;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;

import java.util.List;
import java.util.UUID;

public interface ListerMatieresFormationUseCase {
    List<Matiere> listerMatieres(UUID formationId);
}
