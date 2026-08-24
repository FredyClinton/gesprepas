package com.excelisprepas.backend.apprenant.domain.port.in;

import java.util.UUID;

public interface SupprimerApprenantUseCase {
    void supprimerApprenant(UUID id);
}