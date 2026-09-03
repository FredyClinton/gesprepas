package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Personnel;

import java.util.List;

public interface ListerPersonnelUseCase {
    List<Personnel> listerTous();
}
