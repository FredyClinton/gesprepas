package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.ValidationMouvement;
import com.excelisprepas.backend.financier.domain.port.out.ValidationMouvementRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class ValidationMouvementRepositoryAdapter implements ValidationMouvementRepositoryPort {

    private final ValidationMouvementJpaRepository jpaRepository;
    private final ValidationMouvementPersistenceMapper mapper;

    public ValidationMouvementRepositoryAdapter(ValidationMouvementJpaRepository jpaRepository,
                                                ValidationMouvementPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public ValidationMouvement save(ValidationMouvement validation) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(validation)));
    }

    @Override
    public List<ValidationMouvement> findByMouvementFinancierId(UUID mouvementFinancierId) {
        return jpaRepository.findByMouvementFinancierId(mouvementFinancierId).stream()
                .map(mapper::toDomain).toList();
    }
}