package com.excelisprepas.backend.centre.infrastructure.out.persistence;


import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import org.springframework.stereotype.Component;


import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class CentreRepositoryAdapter implements CentreRepositoryPort {

    private final CentreJpaRepository jpaRepository;
    private final CentrePersistenceMapper mapper;

    public CentreRepositoryAdapter(CentreJpaRepository jpaRepository, CentrePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Centre save(Centre centre) {
        CentreEntity entite = mapper.toEntity(centre);
        CentreEntity sauvegarde = jpaRepository.save(entite);
        return mapper.toDomain(sauvegarde);
    }

    @Override
    public Optional<Centre> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Centre> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public boolean existsByCentreId(UUID centreId) {
        return jpaRepository.existsById(centreId);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }
}
