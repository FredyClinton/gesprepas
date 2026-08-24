package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface RenegocierContratUseCase {
    Apprenant renegocierContrat(UUID apprenantId, BigDecimal nouveauMontant, LocalDate dateDefinition);
}