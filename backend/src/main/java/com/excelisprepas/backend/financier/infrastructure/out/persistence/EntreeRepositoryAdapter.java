package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class EntreeRepositoryAdapter implements EntreeRepositoryPort {

    private final EntreeJpaRepository jpaRepository;
    private final EntreePersistenceMapper mapper;

    public EntreeRepositoryAdapter(EntreeJpaRepository jpaRepository, EntreePersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Entree save(Entree entree) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(entree)));
    }

    @Override
    public Optional<Entree> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<Entree> findByApprenantId(UUID apprenantId) {
        return jpaRepository.findByApprenantId(apprenantId).stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Entree> findByCentreIdAndSessionIdAndDateAndStatut(UUID centreId, UUID sessionId, LocalDate date, StatutMouvement statut) {
        return jpaRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, statut).stream()
                .map(mapper::toDomain).toList();
    }

    @Override
    public List<Entree> findByBilanJournalierId(UUID bilanJournalierId) {
        return jpaRepository.findByBilanJournalierId(bilanJournalierId).stream()
                .map(mapper::toDomain).toList();
    }

    @Override
    public List<Entree> findBySessionId(UUID sessionId) {
        return jpaRepository.findBySessionId(sessionId).stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Entree> findBySessionIdAndCentreId(UUID sessionId, UUID centreId) {
        return jpaRepository.findBySessionIdAndCentreId(sessionId, centreId).stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Entree> findBySessionIdAndStatut(UUID sessionId, StatutMouvement statut) {
        return jpaRepository.findBySessionIdAndStatut(sessionId, statut).stream().map(mapper::toDomain).toList();
    }

    @Override
    public List<Entree> findBySessionIdAndCentreIdAndStatut(UUID sessionId, UUID centreId, StatutMouvement statut) {
        return jpaRepository.findBySessionIdAndCentreIdAndStatut(sessionId, centreId, statut).stream()
                .map(mapper::toDomain).toList();
    }
}