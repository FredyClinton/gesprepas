package com.excelisprepas.backend.personnel.domain.port.in;

import java.util.UUID;

public interface SupprimerPersonnelUseCase {
    void supprimerPersonnel(UUID id);
}
