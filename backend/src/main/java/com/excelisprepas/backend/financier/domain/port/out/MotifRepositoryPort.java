package com.excelisprepas.backend.financier.domain.port.out;

import com.excelisprepas.backend.financier.domain.model.Motif;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MotifRepositoryPort {
    Motif save(Motif motif);

    Optional<Motif> findById(UUID id);

    List<Motif> findAll();
}