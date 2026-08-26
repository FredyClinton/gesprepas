package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class SortieRepositoryAdapter implements SortieRepositoryPort {

    private final SortieJpaRepository jpaRepository;
    private final SortiePersistenceMapper mapper;

    public SortieRepositoryAdapter(SortieJpaRepository jpaRepository, SortiePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Sortie save(Sortie sortie) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(sortie)));
    }

    @Override
    public Optional<Sortie> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Sortie> findByCentreIdAndSessionIdAndDateAndStatut(UUID centreId, UUID sessionId, LocalDate date, StatutMouvement statut) {
        return jpaRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, statut).stream()
                .map(mapper::toDomain).toList();
    }
}