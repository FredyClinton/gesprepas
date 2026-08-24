package com.excelisprepas.backend.formation.domain.port.in;

import java.util.UUID;

public interface SupprimerFormationUseCase {
    void supprimerFormation(UUID id);
}