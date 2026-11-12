package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;

import java.util.List;

public interface ListerApprenantsUseCase {
    List<Apprenant> listerApprenants();

    /** Apprenants d'une session et/ou d'un centre (paramètre null = pas de filtre sur ce critère). */
    List<Apprenant> listerApprenants(java.util.UUID sessionId, java.util.UUID centreId);
}