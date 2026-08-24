package com.excelisprepas.backend.personnel.domain.port.in;

import java.util.UUID;

public interface SupprimerEnseignantUseCase {
    void supprimerEnseignant(UUID id);
}