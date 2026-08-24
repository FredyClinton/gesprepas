package com.excelisprepas.backend.departement.domain.port.in;

import java.util.UUID;

public interface SupprimerDepartementUseCase {
    void supprimerDepartement(UUID id);
}