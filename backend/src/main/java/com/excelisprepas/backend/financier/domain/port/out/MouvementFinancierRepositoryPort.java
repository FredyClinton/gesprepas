package com.excelisprepas.backend.financier.domain.port.out;

import com.excelisprepas.backend.financier.domain.model.MouvementFinancier;

import java.util.Optional;
import java.util.UUID;

public interface MouvementFinancierRepositoryPort {
    Optional<MouvementFinancier> findById(UUID id);

    MouvementFinancier save(MouvementFinancier mouvement);
}