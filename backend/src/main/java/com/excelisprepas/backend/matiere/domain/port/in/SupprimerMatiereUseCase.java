package com.excelisprepas.backend.matiere.domain.port.in;

import java.util.UUID;

public interface SupprimerMatiereUseCase {
    void supprimerMatiere(UUID id);
}
