package com.excelisprepas.backend.academie.progression.domain.port.in;

import com.excelisprepas.backend.academie.progression.domain.model.Progression;

import java.util.List;

public interface ListerProgressionsUseCase {
    List<Progression> listerProgressions();
}