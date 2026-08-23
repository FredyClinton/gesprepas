package com.excelisprepas.backend.session.domain.model;

import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

/**
 * Une SessionAcademique : période globale (ex: "2026-2027") sous laquelle
 * tous les centres ouverts opèrent. Ne référence aucun Centre —
 * ce sont les autres entités (Apprenant, MouvementFinancier, ...)
 * qui référencent la session, jamais l'inverse.
 */
public class SessionAcademique {

    private final UUID id;
    private final String annee;
    private final LocalDate dateDebut;
    private final LocalDate dateFin;
    private StatutSession statut;

    public SessionAcademique(UUID id, String annee, LocalDate dateDebut, LocalDate dateFin) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.annee = validerChampObligatoire(annee, "annee");
        this.dateDebut = Objects.requireNonNull(dateDebut, "dateDebut ne peut pas être nulle");
        this.dateFin = Objects.requireNonNull(dateFin, "dateFin ne peut pas être nulle");
        if (!dateFin.isAfter(dateDebut)) {
            throw new IllegalArgumentException("dateFin doit être postérieure à dateDebut");
        }
        this.statut = StatutSession.PLANIFIEE;
    }

    private SessionAcademique(UUID id, String annee, LocalDate dateDebut, LocalDate dateFin, StatutSession statut) {
        this.id = id;
        this.annee = annee;
        this.dateDebut = dateDebut;
        this.dateFin = dateFin;
        this.statut = statut;
    }

    public static SessionAcademique reconstituer(UUID id, String annee, LocalDate dateDebut,
                                                 LocalDate dateFin, StatutSession statut) {
        Objects.requireNonNull(id, "id ne peut pas être nul");
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        return new SessionAcademique(id, annee, dateDebut, dateFin, statut);
    }

    private static String validerChampObligatoire(String valeur, String nomChamp) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(nomChamp + " ne peut pas être vide");
        }
        return valeur;
    }

    public void demarrer() {
        if (statut != StatutSession.PLANIFIEE) {
            throw new IllegalStateException("Seule une session PLANIFIEE peut démarrer");
        }
        this.statut = StatutSession.EN_COURS;
    }

    public void cloturer() {
        if (statut != StatutSession.EN_COURS) {
            throw new IllegalStateException("Seule une session EN_COURS peut être clôturée");
        }
        this.statut = StatutSession.CLOTUREE;
    }

    public UUID getId() {
        return id;
    }

    public String getAnnee() {
        return annee;
    }

    public LocalDate getDateDebut() {
        return dateDebut;
    }

    public LocalDate getDateFin() {
        return dateFin;
    }

    public StatutSession getStatut() {
        return statut;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof SessionAcademique that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}