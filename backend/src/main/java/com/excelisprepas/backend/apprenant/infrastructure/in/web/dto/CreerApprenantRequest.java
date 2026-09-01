
package com.excelisprepas.backend.apprenant.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;
import java.util.UUID;

public record CreerApprenantRequest(
        @NotBlank(message = "Le nom est obligatoire") String nom,
        @NotBlank(message = "Le prénom est obligatoire") String prenom,
        @NotNull(message = "La date de naissance est obligatoire")
        @Past(message = "La date de naissance doit être dans le passé") LocalDate dateNaissance,
        @NotNull(message = "La date d'inscription est obligatoire") LocalDate dateInscription,
        @NotNull(message = "Le centre est obligatoire") UUID centreId,
        String contactApprenant,
        String nomParent,
        String contactParent
) {
}