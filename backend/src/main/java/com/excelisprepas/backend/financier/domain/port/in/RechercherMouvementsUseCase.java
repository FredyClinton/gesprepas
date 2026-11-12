package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements;
import com.excelisprepas.backend.financier.domain.model.ResultatRechercheMouvements;

public interface RechercherMouvementsUseCase {

    ResultatRechercheMouvements rechercherMouvements(CriteresRechercheMouvements criteres);
}
