package com.excelisprepas.backend.rattachement.domain.port.in;

import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;

import java.util.UUID;

public interface RecupererRattachementUseCase {
    RattachementCentre recuperer(UUID id);
}