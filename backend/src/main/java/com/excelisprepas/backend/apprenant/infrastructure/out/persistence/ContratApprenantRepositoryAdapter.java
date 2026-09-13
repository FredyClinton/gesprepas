package com.excelisprepas.backend.apprenant.infrastructure.out.persistence;

import com.excelisprepas.backend.apprenant.domain.model.ContratApprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ContratApprenantRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class ContratApprenantRepositoryAdapter implements ContratApprenantRepositoryPort {

    private final ContratApprenantJpaRepository jpaRepository;

    public ContratApprenantRepositoryAdapter(ContratApprenantJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    private static ContratApprenant toDomain(ContratApprenantEntity entity) {
        return new ContratApprenant(
                entity.getId(),
                entity.getApprenantId(),
                entity.getReference(),
                entity.getDateSignature(),
                entity.getMontantTotal(),
                entity.getStatut(),
                entity.getObservations()
        );
    }

    private static ContratApprenantEntity toEntity(ContratApprenant domain) {
        return new ContratApprenantEntity(
                domain.getId(),
                domain.getApprenantId(),
                domain.getReference(),
                domain.getDateSignature(),
                domain.getMontantTotal(),
                domain.getStatut(),
                domain.getObservations()
        );
    }

    @Override
    public ContratApprenant save(ContratApprenant contrat) {
        ContratApprenantEntity entity = toEntity(contrat);
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<ContratApprenant> findById(UUID id) {
        return jpaRepository.findById(id).map(ContratApprenantRepositoryAdapter::toDomain);
    }

    @Override
    public List<ContratApprenant> findByApprenantId(UUID apprenantId) {
        return jpaRepository.findByApprenantIdOrderByDateSignatureDesc(apprenantId).stream()
                .map(ContratApprenantRepositoryAdapter::toDomain)
                .toList();
    }
}

