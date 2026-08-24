package com.excelisprepas.backend.centre.domain.port.in;

import com.excelisprepas.backend.centre.domain.model.Centre;

import java.util.List;

public interface ListerCentresUseCase {
    List<Centre> listerCentres();
}