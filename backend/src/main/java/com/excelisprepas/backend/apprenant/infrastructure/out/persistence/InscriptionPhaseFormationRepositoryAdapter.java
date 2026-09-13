package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import com.excelisprepas.backend.apprenant.domain.model.InscriptionPhaseFormation;
import com.excelisprepas.backend.apprenant.domain.port.out.InscriptionPhaseFormationRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class InscriptionPhaseFormationRepositoryAdapter implements InscriptionPhaseFormationRepositoryPort {

    private final InscriptionPhaseFormationJpaRepository jpaRepository;

    public InscriptionPhaseFormationRepositoryAdapter(InscriptionPhaseFormationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    private static InscriptionPhaseFormation toDomain(InscriptionPhaseFormationEntity entity) {
        return new InscriptionPhaseFormation(
                entity.getId(),
                entity.getApprenantId(),
                entity.getContratId(),
                entity.getPhaseId(),
                entity.getFormationId(),
                entity.getStatut(),
                entity.getDateDebut(),
                entity.getDateFin(),
                entity.getFormationPrecedenteId()
        );
    }

    private static InscriptionPhaseFormationEntity toEntity(InscriptionPhaseFormation domain) {
        return new InscriptionPhaseFormationEntity(
                domain.getId(),
                domain.getApprenantId(),
                domain.getContratId(),
                domain.getPhaseId(),
                domain.getFormationId(),
                domain.getStatut(),
                domain.getDateDebut(),
                domain.getDateFin(),
                domain.getFormationPrecedenteId()
        );
    }

    @Override
    public InscriptionPhaseFormation save(InscriptionPhaseFormation inscription) {
        InscriptionPhaseFormationEntity entity = toEntity(inscription);
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<InscriptionPhaseFormation> findById(UUID id) {
        return jpaRepository.findById(id).map(InscriptionPhaseFormationRepositoryAdapter::toDomain);
    }

    @Override
    public List<InscriptionPhaseFormation> findByApprenantId(UUID apprenantId) {
        return jpaRepository.findByApprenantIdOrderByDateDebutDesc(apprenantId).stream()
                .map(InscriptionPhaseFormationRepositoryAdapter::toDomain)
                .toList();
    }

    @Override
    public Optional<InscriptionPhaseFormation> findByApprenantIdAndPhaseId(UUID apprenantId, UUID phaseId) {
        return jpaRepository.findByApprenantIdAndPhaseId(apprenantId, phaseId)
                .map(InscriptionPhaseFormationRepositoryAdapter::toDomain);
    }

    @Override
    public List<InscriptionPhaseFormation> findByPhaseIdAndFormationId(UUID phaseId, UUID formationId) {
        return jpaRepository.findByPhaseIdAndFormationId(phaseId, formationId).stream()
                .map(InscriptionPhaseFormationRepositoryAdapter::toDomain)
                .toList();
    }
}

