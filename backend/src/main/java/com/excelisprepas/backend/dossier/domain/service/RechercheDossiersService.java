package com.excelisprepas.backend.dossier.domain.service;

import com.excelisprepas.backend.dossier.domain.model.CriteresRechercheDossiers;
import com.excelisprepas.backend.dossier.domain.model.ResultatRechercheDossiers;
import com.excelisprepas.backend.dossier.domain.port.in.RechercherDossiersUseCase;
import com.excelisprepas.backend.dossier.domain.port.out.RechercheDossiersPort;

import java.util.Objects;

public class RechercheDossiersService implements RechercherDossiersUseCase {

    private final RechercheDossiersPort rechercheDossiersPort;

    public RechercheDossiersService(RechercheDossiersPort rechercheDossiersPort) {
        this.rechercheDossiersPort = Objects.requireNonNull(rechercheDossiersPort);
    }

    @Override
    public ResultatRechercheDossiers rechercherDossiers(CriteresRechercheDossiers criteres) {
        return rechercheDossiersPort.rechercher(Objects.requireNonNull(criteres));
    }
}
