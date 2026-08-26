package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.financier.domain.model.ValidationMouvement;

import java.util.UUID;

public interface ValiderMouvementUseCase {
    ValidationMouvement validerMouvement(UUID mouvementFinancierId, StatutMouvement decision, UUID validateurUtilisateurId);
}