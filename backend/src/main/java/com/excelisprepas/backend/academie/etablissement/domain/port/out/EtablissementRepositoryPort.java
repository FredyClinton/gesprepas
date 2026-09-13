package com.excelisprepas.backend.academie.etablissement.domain.port.out;

import com.excelisprepas.backend.academie.etablissement.domain.model.Etablissement;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EtablissementRepositoryPort {

    Etablissement save(Etablissement etablissement);

    Optional<Etablissement> findById(UUID id);

    Optional<Etablissement> findByNomIgnoreCase(String nom);

    List<Etablissement> findAll();
}

