package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public interface SuspendreEnseignantUseCase {
    Enseignant suspendreEnseignant(RoleUtilisateur appelant, UUID id);
}