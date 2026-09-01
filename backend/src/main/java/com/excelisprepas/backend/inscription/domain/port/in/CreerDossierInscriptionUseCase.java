package com.excelisprepas.backend.inscription.domain.port.in;

import com.excelisprepas.backend.inscription.domain.model.DossierInscription;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface CreerDossierInscriptionUseCase {
    DossierInscription creerDossierInscription(UUID apprenantId, UUID sessionId, UUID centreId,
                                               BigDecimal montantGlobal, LocalDate dateInscription,
                                               Boolean preInscrit, String referenceRecu,
                                               List<UUID> phasesSouscrites, List<UUID> formationsCibles,
                                               List<UUID> concoursCibles);
}

