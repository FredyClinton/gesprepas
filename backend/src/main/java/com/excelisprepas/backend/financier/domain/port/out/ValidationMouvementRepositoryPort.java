package com.excelisprepas.backend.financier.domain.port.out;

import com.excelisprepas.backend.financier.domain.model.ValidationMouvement;

import java.util.List;
import java.util.UUID;

public interface ValidationMouvementRepositoryPort {
    ValidationMouvement save(ValidationMouvement validation);

    List<ValidationMouvement> findByMouvementFinancierId(UUID mouvementFinancierId);
}