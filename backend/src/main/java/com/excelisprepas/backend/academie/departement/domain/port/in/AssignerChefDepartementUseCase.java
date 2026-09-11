package com.excelisprepas.backend.academie.departement.domain.port.in;

import java.util.UUID;

public interface AssignerChefDepartementUseCase {
    void assignerChef(UUID departementId, UUID utilisateurId);
}

