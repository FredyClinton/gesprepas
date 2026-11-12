package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.dossier.domain.model.CriteresRechercheDossiers;
import com.excelisprepas.backend.dossier.domain.model.ResultatRechercheDossiers;

public interface RechercherDossiersUseCase {

    ResultatRechercheDossiers rechercherDossiers(CriteresRechercheDossiers criteres);
}
