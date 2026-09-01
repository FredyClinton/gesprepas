package com.excelisprepas.backend.academie.departement.domain.port.in;

import java.util.UUID;

public interface SupprimerDepartementUseCase {
    void supprimerDepartement(UUID id);
}