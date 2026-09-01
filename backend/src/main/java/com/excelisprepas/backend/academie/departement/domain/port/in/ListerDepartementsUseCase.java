package com.excelisprepas.backend.academie.departement.domain.port.in;

import com.excelisprepas.backend.academie.departement.domain.model.Departement;

import java.util.List;

public interface ListerDepartementsUseCase {
    List<Departement> listerDepartements();
}