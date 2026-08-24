package com.excelisprepas.backend.session.domain.port.in;

import java.util.UUID;

public interface SupprimerSessionUseCase {
    void supprimerSession(UUID id);
}