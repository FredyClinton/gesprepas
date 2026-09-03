package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Personnel;

public interface CreerPersonnelUseCase {
    Personnel creerPersonnel(String nom, String prenom, String telephone, String numeroCni, String email);
}
