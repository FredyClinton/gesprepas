package com.excelisprepas.backend.rattachement.domain.port.in;

import java.util.UUID;

public interface SupprimerRattachementUseCase {
    void supprimer(UUID id);
}