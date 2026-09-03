package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueTarifEnseignant;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueTarifRepositoryPort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class HistoriqueTarifRepositoryAdapter implements HistoriqueTarifRepositoryPort {

    private final HistoriqueTarifJpaRepository repository;
    private final HistoriqueTarifPersistenceMapper mapper;

    public HistoriqueTarifRepositoryAdapter(HistoriqueTarifJpaRepository repository, HistoriqueTarifPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public HistoriqueTarifEnseignant save(HistoriqueTarifEnseignant historique) {
        HistoriqueTarifEntity entity = mapper.toEntity(historique);
        return mapper.toDomain(repository.save(entity));
    }

    @Override
    public List<HistoriqueTarifEnseignant> findByEnseignantIdAndSessionId(UUID enseignantId, UUID sessionId) {
        return repository.findByEnseignantIdAndSessionId(enseignantId, sessionId)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<HistoriqueTarifEnseignant> findTarifApplicable(UUID enseignantId, UUID sessionId, int semaine) {
        return repository.findTarifApplicable(enseignantId, sessionId, semaine)
                .map(mapper::toDomain);
    }
}
