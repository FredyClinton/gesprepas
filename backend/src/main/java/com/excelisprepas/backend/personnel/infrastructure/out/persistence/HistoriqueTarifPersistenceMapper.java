package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueTarifEnseignant;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface HistoriqueTarifPersistenceMapper {
    HistoriqueTarifEntity toEntity(HistoriqueTarifEnseignant domain);
    HistoriqueTarifEnseignant toDomain(HistoriqueTarifEntity entity);
}
