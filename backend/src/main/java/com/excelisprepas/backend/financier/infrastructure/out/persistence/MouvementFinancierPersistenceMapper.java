package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.MouvementFinancier;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import org.springframework.stereotype.Component;

@Component
public class MouvementFinancierPersistenceMapper {

    private final EntreePersistenceMapper entreeMapper;
    private final SortiePersistenceMapper sortieMapper;

    public MouvementFinancierPersistenceMapper(EntreePersistenceMapper entreeMapper, SortiePersistenceMapper sortieMapper) {
        this.entreeMapper = entreeMapper;
        this.sortieMapper = sortieMapper;
    }

    public MouvementFinancier toDomain(MouvementFinancierEntity entite) {
        if (entite == null) return null;
        if (entite instanceof EntreeEntity entreeEntite) {
            return entreeMapper.toDomain(entreeEntite);
        }
        if (entite instanceof SortieEntity sortieEntite) {
            return sortieMapper.toDomain(sortieEntite);
        }
        throw new IllegalStateException("Type de MouvementFinancierEntity non géré : " + entite.getClass());
    }

    public MouvementFinancierEntity toEntity(MouvementFinancier domaine) {
        if (domaine == null) return null;
        if (domaine instanceof Entree entree) {
            return entreeMapper.toEntity(entree);
        }
        if (domaine instanceof Sortie sortie) {
            return sortieMapper.toEntity(sortie);
        }
        throw new IllegalStateException("Type de MouvementFinancier non géré : " + domaine.getClass());
    }
}