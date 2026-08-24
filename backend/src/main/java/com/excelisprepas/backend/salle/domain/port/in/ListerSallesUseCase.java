package com.excelisprepas.backend.salle.domain.port.in;

import com.excelisprepas.backend.salle.domain.model.Salle;

import java.util.List;

public interface ListerSallesUseCase {
    List<Salle> listerSalles();
}