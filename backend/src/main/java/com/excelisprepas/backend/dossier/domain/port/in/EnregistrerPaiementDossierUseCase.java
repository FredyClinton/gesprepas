package com.excelisprepas.backend.dossier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.Entree;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface EnregistrerPaiementDossierUseCase {
    Entree enregistrerPaiementDossier(UUID dossierConcoursId, UUID motifId, BigDecimal montant,
                                      LocalDate date, UUID saisiParUtilisateurId);
}