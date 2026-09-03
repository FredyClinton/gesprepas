package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface HistoriqueSalairePersonnelPersistenceMapper {
    HistoriqueSalairePersonnelEntity toEntity(HistoriqueSalairePersonnel domain);
    HistoriqueSalairePersonnel toDomain(HistoriqueSalairePersonnelEntity entity);
}
