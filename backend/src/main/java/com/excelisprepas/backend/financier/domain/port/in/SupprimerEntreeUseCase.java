package com.excelisprepas.backend.financier.domain.port.in;

import java.util.UUID;

public interface SupprimerEntreeUseCase {
    void supprimerEntree(UUID entreeId);
}

