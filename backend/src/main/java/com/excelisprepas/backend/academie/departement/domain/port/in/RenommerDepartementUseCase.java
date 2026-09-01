package com.excelisprepas.backend.academie.departement.domain.port.in;

import com.excelisprepas.backend.academie.departement.domain.model.Departement;

import java.util.UUID;

public interface RenommerDepartementUseCase {
    Departement renommerDepartement(UUID id, String nouveauNom);
}