package com.excelisprepas.backend.inscription.infrastructure.out.persistence;

import com.excelisprepas.backend.inscription.domain.model.DossierInscription;
import com.excelisprepas.backend.inscription.domain.port.out.DossierInscriptionRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class DossierInscriptionRepositoryAdapter implements DossierInscriptionRepositoryPort {

    private final DossierInscriptionJpaRepository repository;
    private final DossierInscriptionPersistenceMapper mapper;

    public DossierInscriptionRepositoryAdapter(DossierInscriptionJpaRepository repository, DossierInscriptionPersistenceMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    public DossierInscription save(DossierInscription dossierInscription) {
        DossierInscriptionEntity entity = mapper.toEntity(dossierInscription);
        DossierInscriptionEntity savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<DossierInscription> findById(UUID id) {
        return repository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<DossierInscription> findByApprenantIdAndSessionId(UUID apprenantId, UUID sessionId) {
        return repository.findByApprenantIdAndSessionId(apprenantId, sessionId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }
}

