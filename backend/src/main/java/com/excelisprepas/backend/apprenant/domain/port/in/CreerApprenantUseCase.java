package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;


import java.time.LocalDate;
import java.util.UUID;

public interface CreerApprenantUseCase {
    Apprenant creerApprenant(String nom, String prenom, LocalDate dateNaissance,
                             LocalDate dateInscription, UUID centreId,
                             String contactApprenant, String nomParent, String contactParent);
}