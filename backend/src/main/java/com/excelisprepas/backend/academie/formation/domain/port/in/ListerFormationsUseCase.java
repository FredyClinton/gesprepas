package com.excelisprepas.backend.academie.formation.domain.port.in;

import com.excelisprepas.backend.academie.formation.domain.model.Formation;

import java.util.List;

public interface ListerFormationsUseCase {
    List<Formation> listerFormations();
}