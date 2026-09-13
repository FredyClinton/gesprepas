package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;

import java.time.LocalDate;
import java.util.UUID;

public interface ModifierApprenantUseCase {
    Apprenant modifierApprenant(UUID id, String nom, String prenom, LocalDate dateNaissance,
                                String contactApprenant, String nomParent, String contactParent,
                                String etablissementOrigine);
}
