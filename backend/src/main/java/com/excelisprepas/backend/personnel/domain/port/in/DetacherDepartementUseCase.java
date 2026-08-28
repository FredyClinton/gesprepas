package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

import java.util.UUID;

public interface DetacherDepartementUseCase {
    Utilisateur detacherDepartement(UUID id);
}
