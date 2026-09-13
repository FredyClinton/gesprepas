package com.excelisprepas.backend.academie.etablissement.infrastructure.in.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreerEtablissementRequest(
        @NotBlank(message = "Le nom de l'établissement est requis")
        @Size(min = 2, max = 255, message = "Le nom doit comporter entre 2 et 255 caractères")
        String nom,

        @Size(max = 100, message = "La ville ne doit pas dépasser 100 caractères")
        String ville
) {}

