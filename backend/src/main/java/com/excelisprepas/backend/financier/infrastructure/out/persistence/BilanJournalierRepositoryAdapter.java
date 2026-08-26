package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;
import com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Component
public class BilanJournalierRepositoryAdapter implements BilanJournalierRepositoryPort {

    private final BilanJournalierJpaRepository jpaRepository;
    private final BilanJournalierPersistenceMapper mapper;

    public BilanJournalierRepositoryAdapter(BilanJournalierJpaRepository jpaRepository, BilanJournalierPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public BilanJournalier save(BilanJournalier bilan) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(bilan)));
    }

    @Override
    public Optional<BilanJournalier> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<BilanJournalier> findByCentreIdAndSessionIdAndDate(UUID centreId, UUID sessionId, LocalDate date) {
        return jpaRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date).map(mapper::toDomain);
    }
}