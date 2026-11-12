package com.excelisprepas.backend.livre.domain.port.out;

import com.excelisprepas.backend.livre.domain.model.CriteresRechercheVentes;
import com.excelisprepas.backend.livre.domain.model.ResultatRechercheVentes;

public interface RechercheVentesLivresPort {

    ResultatRechercheVentes rechercher(CriteresRechercheVentes criteres);
}
