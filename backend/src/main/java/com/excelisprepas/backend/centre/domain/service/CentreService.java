package com.excelisprepas.backend.centre.domain.service;


import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.in.CreerCentreUseCase;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;

import java.util.UUID;

public class CentreService implements CreerCentreUseCase {

    private final CentreRepositoryPort repository;

    public CentreService(CentreRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Centre creerCentre(String nom, String adresseInitiale, String villeInitiale) {
        Centre centre = new Centre(UUID.randomUUID(), nom, adresseInitiale, villeInitiale);
        return repository.save(centre);
    }
}
