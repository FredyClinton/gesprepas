package com.excelisprepas.backend.livre.domain.service;

import com.excelisprepas.backend.livre.domain.model.CriteresRechercheVentes;
import com.excelisprepas.backend.livre.domain.model.ResultatRechercheVentes;
import com.excelisprepas.backend.livre.domain.port.in.RechercherVentesLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.out.RechercheVentesLivresPort;

import java.util.Objects;

public class RechercheVentesLivresService implements RechercherVentesLivresUseCase {

    private final RechercheVentesLivresPort rechercheVentesLivresPort;

    public RechercheVentesLivresService(RechercheVentesLivresPort rechercheVentesLivresPort) {
        this.rechercheVentesLivresPort = Objects.requireNonNull(rechercheVentesLivresPort);
    }

    @Override
    public ResultatRechercheVentes rechercherVentes(CriteresRechercheVentes criteres) {
        return rechercheVentesLivresPort.rechercher(Objects.requireNonNull(criteres));
    }
}
