package com.excelisprepas.backend.gelenseignants.domain.port.out;

import com.excelisprepas.backend.gelenseignants.domain.model.GelEnseignants;

public interface GelEnseignantsRepositoryPort {
    GelEnseignants recuperer();

    GelEnseignants sauvegarder(GelEnseignants gel);
}
