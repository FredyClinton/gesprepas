// dossier/infrastructure/out/persistence/DossierConcoursRepositoryAdapter.java
package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import com.excelisprepas.backend.dossier.domain.model.DossierConcours;
import com.excelisprepas.backend.dossier.domain.port.out.DossierConcoursRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class DossierConcoursRepositoryAdapter implements DossierConcoursRepositoryPort {

    private final DossierConcoursJpaRepository jpaRepository;
    private final DossierConcoursPersistenceMapper mapper;

    public DossierConcoursRepositoryAdapter(DossierConcoursJpaRepository jpaRepository, DossierConcoursPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public DossierConcours save(DossierConcours dossierConcours) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(dossierConcours)));
    }

    @Override
    public Optional<DossierConcours> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<DossierConcours> findByDossierId(UUID dossierId) {
        return jpaRepository.findByDossierId(dossierId).stream().map(mapper::toDomain).toList();
    }

    @Override
    public boolean existsByDossierIdAndConcoursId(UUID dossierId, UUID concoursId) {
        return jpaRepository.existsByDossierIdAndConcoursId(dossierId, concoursId);
    }

    @Override
    public List<DossierConcours> findByConcoursIdAndSessionId(UUID concoursId, UUID sessionId) {
        return jpaRepository.findByConcoursIdAndSessionId(concoursId, sessionId).stream().map(mapper::toDomain).toList();
    }
}