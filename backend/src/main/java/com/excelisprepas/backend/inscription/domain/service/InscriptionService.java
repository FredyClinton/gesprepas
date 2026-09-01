package com.excelisprepas.backend.inscription.domain.service;

import com.excelisprepas.backend.inscription.domain.model.DossierInscription;
import com.excelisprepas.backend.inscription.domain.port.in.CreerDossierInscriptionUseCase;
import com.excelisprepas.backend.inscription.domain.port.in.RecupererDossierInscriptionUseCase;
import com.excelisprepas.backend.inscription.domain.port.out.DossierInscriptionRepositoryPort;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class InscriptionService implements CreerDossierInscriptionUseCase, RecupererDossierInscriptionUseCase {

    private final DossierInscriptionRepositoryPort dossierInscriptionRepositoryPort;

    public InscriptionService(DossierInscriptionRepositoryPort dossierInscriptionRepositoryPort) {
        this.dossierInscriptionRepositoryPort = dossierInscriptionRepositoryPort;
    }

    @Override
    public DossierInscription creerDossierInscription(UUID apprenantId, UUID sessionId, UUID centreId,
                                                      BigDecimal montantGlobal, LocalDate dateInscription,
                                                      Boolean preInscrit, String referenceRecu,
                                                      List<UUID> phasesSouscrites, List<UUID> formationsCibles,
                                                      List<UUID> concoursCibles) {
        if (Boolean.TRUE.equals(preInscrit)) {
            List<DossierInscription> existants = dossierInscriptionRepositoryPort.findByApprenantIdAndSessionId(apprenantId, sessionId);
            boolean dejaPreInscrit = existants.stream().anyMatch(d -> Boolean.TRUE.equals(d.getPreInscrit()));
            if (dejaPreInscrit) {
                throw new RuntimeException("PreInscriptionDejaConsommeeException");
            }
        }

        DossierInscription dossierInscription = new DossierInscription(
                UUID.randomUUID(), apprenantId, sessionId, centreId, montantGlobal, dateInscription, preInscrit,
                referenceRecu, phasesSouscrites, formationsCibles, concoursCibles
        );

        return dossierInscriptionRepositoryPort.save(dossierInscription);
    }

    @Override
    public DossierInscription recupererDossierInscription(UUID id) {
        return dossierInscriptionRepositoryPort.findById(id).orElseThrow(() -> new RuntimeException("DossierInscription non trouvé"));
    }
}

