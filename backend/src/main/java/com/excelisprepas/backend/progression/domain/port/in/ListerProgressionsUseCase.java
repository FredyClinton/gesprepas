package com.excelisprepas.backend.progression.domain.port.in;

import com.excelisprepas.backend.progression.domain.model.Progression;

import java.util.List;

public interface ListerProgressionsUseCase {
    List<Progression> listerProgressions();
}