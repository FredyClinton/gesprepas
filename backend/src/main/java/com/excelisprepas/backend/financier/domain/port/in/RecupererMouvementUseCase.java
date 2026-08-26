package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.MouvementFinancier;

import java.util.UUID;

public interface RecupererMouvementUseCase {
    MouvementFinancier recupererMouvement(UUID id);
}