package com.excelisprepas.backend.livre.domain.port.out;

import com.excelisprepas.backend.livre.domain.model.Livre;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LivreRepositoryPort {
    Livre save(Livre livre);
    Optional<Livre> findById(UUID id);
    Optional<Livre> findByTitre(String titre);
    List<Livre> findAll();
    List<Livre> findByActifTrue();
    void deleteById(UUID id);
}

