package com.excelisprepas.backend.academie.etablissement.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.etablissement.domain.model.Etablissement;

public final class EtablissementPersistenceMapper {

    private EtablissementPersistenceMapper() {}

    public static Etablissement toDomain(EtablissementEntity entity) {
        if (entity == null) {
            return null;
        }
        return new Etablissement(
                entity.getId(),
                entity.getNom(),
                entity.getVille()
        );
    }

    public static EtablissementEntity toEntity(Etablissement domain) {
        if (domain == null) {
            return null;
        }
        return new EtablissementEntity(
                domain.getId(),
                domain.getNom(),
                domain.getVille()
        );
    }
}

