package com.excelisprepas.backend.academie.salle.domain.port.in;

import java.util.UUID;

public interface SupprimerSalleUseCase {
    void supprimerSalle(UUID id);
}