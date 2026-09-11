package com.excelisprepas.backend.remuneration.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutPaiement;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record SeanceFichePaieItemResponse(
        UUID affectationId,
        int semaine,
        Jour jour,
        int creneauSeance,
        LocalDate dateSeance,
        String horaire,
        String duree,
        String centreNom,
        String formationNom,
        String matiereNom,
        String salleNom,
        String theme,
        BigDecimal coutApplique,
        StatutPaiement statutPaiement
) {}

