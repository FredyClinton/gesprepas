package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.UUID;

public interface SupprimerPersonnelUseCase {
    /** appelant : rôle du jeton, contrôlé contre le compte éventuel du personnel visé. */
    void supprimerPersonnel(RoleUtilisateur appelant, UUID id);
}
