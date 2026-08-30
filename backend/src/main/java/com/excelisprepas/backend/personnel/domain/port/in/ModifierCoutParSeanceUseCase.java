package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.math.BigDecimal;
import java.util.UUID;

public interface ModifierCoutParSeanceUseCase {
    Enseignant modifierCoutParSeance(RoleUtilisateur appelant, UUID id, BigDecimal nouveauCout);
}