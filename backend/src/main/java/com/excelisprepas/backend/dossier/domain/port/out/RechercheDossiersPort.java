package com.excelisprepas.backend.dossier.domain.port.out;

import com.excelisprepas.backend.dossier.domain.model.CriteresRechercheDossiers;
import com.excelisprepas.backend.dossier.domain.model.ResultatRechercheDossiers;

public interface RechercheDossiersPort {

    ResultatRechercheDossiers rechercher(CriteresRechercheDossiers criteres);
}
