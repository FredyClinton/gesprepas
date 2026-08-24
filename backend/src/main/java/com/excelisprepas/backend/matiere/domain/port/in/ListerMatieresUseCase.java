package com.excelisprepas.backend.matiere.domain.port.in;

import com.excelisprepas.backend.matiere.domain.model.Matiere;

import java.util.List;

public interface ListerMatieresUseCase {
    List<Matiere> listerMatieres();
}
