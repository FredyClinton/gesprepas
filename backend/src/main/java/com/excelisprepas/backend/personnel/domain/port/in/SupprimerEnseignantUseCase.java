package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public interface SupprimerEnseignantUseCase {
    void supprimerEnseignant(RoleUtilisateur appelant, UUID id);
}