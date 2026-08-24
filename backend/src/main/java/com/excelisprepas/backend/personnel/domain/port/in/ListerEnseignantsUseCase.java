package com.excelisprepas.backend.personnel.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.Enseignant;

import java.util.List;

public interface ListerEnseignantsUseCase {
    List<Enseignant> listerEnseignants();
}