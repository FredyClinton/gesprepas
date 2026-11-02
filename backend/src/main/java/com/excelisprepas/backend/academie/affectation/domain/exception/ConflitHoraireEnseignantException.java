package com.excelisprepas.backend.academie.affectation.domain.exception;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

public class ConflitHoraireEnseignantException extends RuntimeException {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH'h'mm");

    private final UUID enseignantId;
    private final UUID affectationExistanteId;
    private final LocalDate dateSeance;
    private final LocalTime heureDebut;
    private final LocalTime heureFin;
    private final UUID centreId;
    private final String centreNom;
    private final UUID formationId;
    private final String formationNom;
    private final UUID matiereId;
    private final String matiereNom;

    public ConflitHoraireEnseignantException(
            UUID enseignantId,
            UUID affectationExistanteId,
            LocalDate dateSeance,
            LocalTime heureDebut,
            LocalTime heureFin,
            UUID centreId,
            String centreNom,
            UUID formationId,
            String formationNom,
            UUID matiereId,
            String matiereNom) {
        super(construireMessage(dateSeance, heureDebut, heureFin, centreNom, formationNom));
        this.enseignantId = enseignantId;
        this.affectationExistanteId = affectationExistanteId;
        this.dateSeance = dateSeance;
        this.heureDebut = heureDebut;
        this.heureFin = heureFin;
        this.centreId = centreId;
        this.centreNom = centreNom;
        this.formationId = formationId;
        this.formationNom = formationNom;
        this.matiereId = matiereId;
        this.matiereNom = matiereNom;
    }

    private static String construireMessage(
            LocalDate dateSeance,
            LocalTime heureDebut,
            LocalTime heureFin,
            String centreNom,
            String formationNom) {
        String dateStr = dateSeance != null ? dateSeance.format(DATE_FORMATTER) : "date inconnue";
        String debutStr = heureDebut != null ? heureDebut.format(TIME_FORMATTER) : "??h??";
        String finStr = heureFin != null ? heureFin.format(TIME_FORMATTER) : "??h??";
        String centreStr = (centreNom != null && !centreNom.isBlank()) ? centreNom : "inconnu";
        String formationStr = (formationNom != null && !formationNom.isBlank()) ? formationNom : "inconnue";

        return String.format(
                "Impossible d'affecter cet enseignant : il est déjà programmé le %s de %s à %s au centre %s, classe %s.",
                dateStr, debutStr, finStr, centreStr, formationStr
        );
    }

    public UUID getEnseignantId() {
        return enseignantId;
    }

    public UUID getAffectationExistanteId() {
        return affectationExistanteId;
    }

    public LocalDate getDateSeance() {
        return dateSeance;
    }

    public LocalTime getHeureDebut() {
        return heureDebut;
    }

    public LocalTime getHeureFin() {
        return heureFin;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public String getCentreNom() {
        return centreNom;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public String getFormationNom() {
        return formationNom;
    }

    public UUID getMatiereId() {
        return matiereId;
    }

    public String getMatiereNom() {
        return matiereNom;
    }
}

