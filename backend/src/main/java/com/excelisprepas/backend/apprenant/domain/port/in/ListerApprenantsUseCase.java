package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;

import java.util.List;

public interface ListerApprenantsUseCase {
    List<Apprenant> listerApprenants();
}