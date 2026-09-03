package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface RemunerationPersistenceMapper {

    @Mapping(target = "fiches", ignore = true) // Lignes gérées via Affectation ou mappées explicitement si besoin
    BordereauPaieEntity toEntity(BordereauPaie domain);

    @Mapping(target = "fiches", ignore = true) 
    BordereauPaie toDomain(BordereauPaieEntity entity);
}
