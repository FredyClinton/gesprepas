package com.excelisprepas.backend.centre.domain.port.out;


import com.excelisprepas.backend.centre.domain.model.Centre;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CentreRepositoryPort {
    Centre save(Centre centre);

    Optional<Centre> findById(UUID id);

    List<Centre> findAll();
}
