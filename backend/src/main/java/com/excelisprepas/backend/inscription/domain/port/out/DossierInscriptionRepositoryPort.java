package com.excelisprepas.backend.inscription.domain.port.out;

import com.excelisprepas.backend.inscription.domain.model.DossierInscription;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

public interface DossierInscriptionRepositoryPort {
    DossierInscription save(DossierInscription dossierInscription);
    Optional<DossierInscription> findById(UUID id);
    List<DossierInscription> findByApprenantIdAndSessionId(UUID apprenantId, UUID sessionId);
}

