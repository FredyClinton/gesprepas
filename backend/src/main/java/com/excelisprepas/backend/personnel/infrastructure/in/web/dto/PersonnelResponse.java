package com.excelisprepas.backend.personnel.infrastructure.in.web.dto;

import com.excelisprepas.backend.personnel.domain.model.Personnel;

import java.util.UUID;

public record PersonnelResponse(
        UUID id,
        String nom,
        String prenom,
        String telephone,
        String numeroCni,
        String email
) {
    public static PersonnelResponse fromDomain(Personnel personnel) {
        return new PersonnelResponse(
                personnel.getId(),
                personnel.getNom(),
                personnel.getPrenom(),
                personnel.getTelephone(),
                personnel.getNumeroCni(),
                personnel.getEmail()
        );
    }
}
