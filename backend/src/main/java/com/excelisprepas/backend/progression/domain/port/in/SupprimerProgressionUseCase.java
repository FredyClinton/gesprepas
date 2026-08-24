package com.excelisprepas.backend.progression.domain.port.in;

import java.util.UUID;

public interface SupprimerProgressionUseCase {
    void supprimerProgression(UUID id);
}