package com.excelisprepas.backend.apprenant.domain.port.out;

import com.excelisprepas.backend.apprenant.domain.model.ContratApprenant;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContratApprenantRepositoryPort {
    ContratApprenant save(ContratApprenant contrat);
    Optional<ContratApprenant> findById(UUID id);
    List<ContratApprenant> findByApprenantId(UUID apprenantId);
}

