package com.excelisprepas.backend.formation.domain.port.in;

import com.excelisprepas.backend.formation.domain.model.Formation;

import java.util.List;

public interface ListerFormationsUseCase {
    List<Formation> listerFormations();
}