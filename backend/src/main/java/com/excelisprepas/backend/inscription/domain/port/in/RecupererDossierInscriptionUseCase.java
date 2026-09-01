package com.excelisprepas.backend.inscription.domain.port.in;

import com.excelisprepas.backend.inscription.domain.model.DossierInscription;

import java.util.UUID;

public interface RecupererDossierInscriptionUseCase {
    DossierInscription recupererDossierInscription(UUID id);
}

