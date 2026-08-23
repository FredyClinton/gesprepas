package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface InscrireApprenantUseCase {
    Apprenant inscrireApprenant(String nom, String prenom, LocalDate dateNaissance,
                                LocalDate dateInscription, BigDecimal montantContrat,
                                LocalDate dateDefinitionContrat, UUID centreId, UUID formationId);
}