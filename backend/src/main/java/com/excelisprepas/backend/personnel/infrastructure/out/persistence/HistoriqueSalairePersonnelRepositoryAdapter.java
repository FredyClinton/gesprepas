package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueSalairePersonnelRepositoryPort;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class HistoriqueSalairePersonnelRepositoryAdapter implements HistoriqueSalairePersonnelRepositoryPort {

    private final HistoriqueSalairePersonnelJpaRepository jpaRepository;
    private final HistoriqueSalairePersonnelPersistenceMapper mapper;

    public HistoriqueSalairePersonnelRepositoryAdapter(HistoriqueSalairePersonnelJpaRepository jpaRepository,
                                                       HistoriqueSalairePersonnelPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public HistoriqueSalairePersonnel save(HistoriqueSalairePersonnel historique) {
        HistoriqueSalairePersonnelEntity entity = mapper.toEntity(historique);
        return mapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<HistoriqueSalairePersonnel> findDernierSalaireApplicable(UUID personnelId, UUID sessionId, LocalDate datePaiement) {
        return jpaRepository.findDernierSalaireApplicable(personnelId, sessionId, datePaiement)
                .map(mapper::toDomain);
    }

    @Override
    public List<HistoriqueSalairePersonnel> findByPersonnelIdAndSessionId(UUID personnelId, UUID sessionId) {
        return jpaRepository.findByPersonnelIdAndSessionId(personnelId, sessionId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<HistoriqueSalairePersonnel> findBySessionId(UUID sessionId) {
        return jpaRepository.findBySessionId(sessionId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}
