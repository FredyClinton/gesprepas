package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;
import org.springframework.stereotype.Component;

import java.util.Collections;

@Component
public class RemunerationPersistenceMapper {

    public BordereauPaieEntity toEntity(BordereauPaie domain) {
        if (domain == null) {
            return null;
        }
        BordereauPaieEntity entity = new BordereauPaieEntity();
        entity.setId(domain.getId());
        entity.setSessionId(domain.getSessionId());
        entity.setReference(domain.getReference());
        entity.setDatePaiement(domain.getDatePaiement());
        entity.setNombreTotalEnseignants(domain.getNombreTotalEnseignants());
        entity.setNombreTotalSeances(domain.getNombreTotalSeances());
        entity.setMontantTotalGlobal(domain.getMontantTotalGlobal());
        entity.setSortieId(domain.getSortieId());
        entity.setSaisiPar(domain.getSaisiPar());
        return entity;
    }

    public BordereauPaie toDomain(BordereauPaieEntity entity) {
        if (entity == null) {
            return null;
        }
        return BordereauPaie.reconstituer(
                entity.getId(),
                entity.getSessionId(),
                entity.getReference(),
                entity.getDatePaiement(),
                Collections.emptyList(),
                entity.getNombreTotalEnseignants(),
                entity.getNombreTotalSeances(),
                entity.getMontantTotalGlobal(),
                entity.getSortieId(),
                entity.getSaisiPar()
        );
    }
}
