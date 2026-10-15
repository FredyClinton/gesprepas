package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface AccesPersonnelPersistenceMapper {

    AccesPersonnel toDomain(AccesPersonnelEntity entity);

    AccesPersonnelEntity toEntity(AccesPersonnel domain);
}
