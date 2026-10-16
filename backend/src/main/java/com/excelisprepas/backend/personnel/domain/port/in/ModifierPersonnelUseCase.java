package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Personnel;

import java.util.UUID;

public interface ModifierPersonnelUseCase {
    Personnel modifierPersonnel(UUID id, String nom, String prenom, String telephone, String numeroCni, String email);
}
