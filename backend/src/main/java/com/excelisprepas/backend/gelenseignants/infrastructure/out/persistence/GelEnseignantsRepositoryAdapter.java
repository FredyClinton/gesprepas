package com.excelisprepas.backend.gelenseignants.infrastructure.out.persistence;

import com.excelisprepas.backend.gelenseignants.domain.model.GelEnseignants;
import com.excelisprepas.backend.gelenseignants.domain.port.out.GelEnseignantsRepositoryPort;
import org.springframework.stereotype.Component;

@Component
public class GelEnseignantsRepositoryAdapter implements GelEnseignantsRepositoryPort {

    // Ligne unique en base — pas de clé métier, l'id est fixé arbitrairement.
    private static final long SINGLETON_ID = 1L;

    private final GelEnseignantsJpaRepository jpaRepository;

    public GelEnseignantsRepositoryAdapter(GelEnseignantsJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public GelEnseignants recuperer() {
        return jpaRepository.findById(SINGLETON_ID)
                .map(entite -> new GelEnseignants(entite.isActif(), entite.getDateFin()))
                .orElseGet(() -> new GelEnseignants(false, null));
    }

    @Override
    public GelEnseignants sauvegarder(GelEnseignants gel) {
        GelEnseignantsEntity entite = jpaRepository.findById(SINGLETON_ID).orElseGet(GelEnseignantsEntity::new);
        entite.setId(SINGLETON_ID);
        entite.setActif(gel.isActif());
        entite.setDateFin(gel.getDateFin());
        GelEnseignantsEntity sauvegarde = jpaRepository.save(entite);
        return new GelEnseignants(sauvegarde.isActif(), sauvegarde.getDateFin());
    }
}
