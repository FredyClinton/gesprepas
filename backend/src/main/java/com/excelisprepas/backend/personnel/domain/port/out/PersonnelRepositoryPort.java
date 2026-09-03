package com.excelisprepas.backend.personnel.domain.port.out;

import com.excelisprepas.backend.personnel.domain.model.Personnel;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PersonnelRepositoryPort {
    Personnel save(Personnel personnel);
    Optional<Personnel> findById(UUID id);
    List<Personnel> findAll();
    void deleteById(UUID id);
}
