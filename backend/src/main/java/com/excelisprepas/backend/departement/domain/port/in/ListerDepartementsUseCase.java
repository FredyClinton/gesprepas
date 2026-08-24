package com.excelisprepas.backend.departement.domain.port.in;

import com.excelisprepas.backend.departement.domain.model.Departement;

import java.util.List;

public interface ListerDepartementsUseCase {
    List<Departement> listerDepartements();
}