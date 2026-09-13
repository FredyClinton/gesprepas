package com.excelisprepas.backend.apprenant.domain.port.in;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;


import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface CreerApprenantUseCase {
    Apprenant creerApprenant(String nom, String prenom, LocalDate dateNaissance,
                             LocalDate dateInscription, UUID centreId,
                             String contactApprenant, String nomParent, String contactParent,
                             String etablissementOrigine);

    Apprenant creerApprenant(String nom, String prenom, LocalDate dateNaissance,
                             LocalDate dateInscription, UUID centreId,
                             String contactApprenant, String nomParent, String contactParent,
                             String etablissementOrigine, UUID formationId, BigDecimal montantContrat,
                             Boolean preInscrit, String referenceRecu);
}