package com.excelisprepas.backend.academie.matiere.domain.port.in;

import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;

import java.util.List;

public interface ListerMatieresUseCase {
    List<Matiere> listerMatieres();
}
