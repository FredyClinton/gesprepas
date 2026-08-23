package com.excelisprepas.backend.centre.domain.port.in;

import com.excelisprepas.backend.centre.domain.model.Centre;

public interface CreerCentreUseCase {
    Centre creerCentre(String nom, String adresseInitiale, String villeInitiale);
}
