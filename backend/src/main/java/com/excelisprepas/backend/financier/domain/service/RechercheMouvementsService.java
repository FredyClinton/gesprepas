package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements;
import com.excelisprepas.backend.financier.domain.model.ResultatRechercheMouvements;
import com.excelisprepas.backend.financier.domain.port.in.RechercherMouvementsUseCase;
import com.excelisprepas.backend.financier.domain.port.out.RechercheMouvementsPort;

import java.util.Objects;

public class RechercheMouvementsService implements RechercherMouvementsUseCase {

    private final RechercheMouvementsPort rechercheMouvementsPort;

    public RechercheMouvementsService(RechercheMouvementsPort rechercheMouvementsPort) {
        this.rechercheMouvementsPort = Objects.requireNonNull(rechercheMouvementsPort);
    }

    @Override
    public ResultatRechercheMouvements rechercherMouvements(CriteresRechercheMouvements criteres) {
        return rechercheMouvementsPort.rechercher(Objects.requireNonNull(criteres));
    }
}
