package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record EnseignantResponse(
        UUID id,
        String nom,
        String prenom,
        String matricule,
        BigDecimal coutParSeance,
        StatutEnseignant statut,
        String telephone,
        String numeroCni,
        String ecoleFonction,
        String niveauGrade,
        LocalDate dateRecrutement
) {
}