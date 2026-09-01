package com.excelisprepas.backend.academie.matiere.domain.port.in;

import java.util.UUID;

public interface SupprimerMatiereUseCase {
    void supprimerMatiere(UUID id);
}
