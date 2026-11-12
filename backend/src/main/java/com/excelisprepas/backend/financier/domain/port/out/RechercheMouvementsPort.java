package com.excelisprepas.backend.financier.domain.port.out;

import com.excelisprepas.backend.financier.domain.model.CriteresRechercheMouvements;
import com.excelisprepas.backend.financier.domain.model.ResultatRechercheMouvements;

/** Lecture paginée des mouvements (filtrage, tri, solde progressif et totaux calculés par la base). */
public interface RechercheMouvementsPort {

    ResultatRechercheMouvements rechercher(CriteresRechercheMouvements criteres);
}
