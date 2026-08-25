package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreerApprenantRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotBlank(message = "Le prénom est obligatoire") String prenom,
        @NotNull(message = "La date de naissance est obligatoire")
        @Past(message = "La date de naissance doit être dans le passé") LocalDate dateNaissance,
        @NotNull(message = "La date d'inscription est obligatoire") LocalDate dateInscription,
        @NotNull(message = "Le montant du contrat est obligatoire")
        @DecimalMin(value = "0.0", message = "Le montant du contrat ne peut pas être négatif") BigDecimal montantContrat,
        @NotNull(message = "La date de définition du contrat est obligatoire") LocalDate dateDefinitionContrat,
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        @NotNull(message = "La session est obligatoire") UUID sessionId,
        @NotNull(message = "La formation est obligatoire") UUID formationId
) {
}