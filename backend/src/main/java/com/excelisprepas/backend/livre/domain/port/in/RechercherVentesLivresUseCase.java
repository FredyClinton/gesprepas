package com.excelisprepas.backend.livre.domain.port.in;

import com.excelisprepas.backend.livre.domain.model.CriteresRechercheVentes;
import com.excelisprepas.backend.livre.domain.model.ResultatRechercheVentes;

public interface RechercherVentesLivresUseCase {

    ResultatRechercheVentes rechercherVentes(CriteresRechercheVentes criteres);
}
