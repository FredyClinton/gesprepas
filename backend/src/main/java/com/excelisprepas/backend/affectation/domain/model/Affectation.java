package com.excelisprepas.backend.affectation.domain.model;

import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public class Affectation {

    private static final Set<StatutAffectation> STATUTS_ASSIGNABLES =
            Set.of(StatutAffectation.PLANIFIEE, StatutAffectation.ASSIGNEE);
    private final UUID id;
    private final UUID centreId;
    private final UUID formationId;
    private final UUID salleId;
    private final UUID matiereId;
    private final int seance;
    private final int semaine;
    private UUID enseignantId;
    private StatutAffectation statut;

    public Affectation(UUID id, UUID centreId, UUID formationId, UUID salleId, UUID matiereId,
                       UUID enseignantId, int seance, int semaine, StatutAffectation statut) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
        this.salleId = Objects.requireNonNull(salleId, "salleId ne peut pas être nul");
        this.matiereId = Objects.requireNonNull(matiereId, "matiereId ne peut pas être nul");
        this.enseignantId = enseignantId; // nullable : pas encore assigné à la création
        this.seance = validerPositif(seance, "seance");
        this.semaine = validerPositif(semaine, "semaine");
        this.statut = Objects.requireNonNull(statut, "statut ne peut pas être nul");
    }

    private static int validerPositif(int valeur, String nomChamp) {
        if (valeur <= 0) {
            throw new IllegalArgumentException(nomChamp + " doit être strictement positif");
        }
        return valeur;
    }

    /**
     * Assigne (ou réassigne/remplace) l'enseignant sur ce créneau.
     * Autorisé depuis PLANIFIEE (première assignation) et depuis ASSIGNEE
     * (remplacement — écrase l'ancien enseignant sans conserver d'historique,
     * conforme à la logique hebdomadaire de réaffectation des enseignants).
     * Refusé une fois le créneau EFFECTUEE ou ANNULEE.
     */
    public void assignerEnseignant(UUID enseignantId) {
        if (!STATUTS_ASSIGNABLES.contains(statut)) {
            throw new IllegalStateException(
                    "Impossible d'assigner un enseignant : le créneau est " + statut);
        }
        this.enseignantId = Objects.requireNonNull(enseignantId, "enseignantId ne peut pas être nul");
        this.statut = StatutAffectation.ASSIGNEE;
    }

    /**
     * Marque le créneau comme effectué. Nécessite qu'un enseignant ait été
     * assigné au préalable (statut ASSIGNEE) — un créneau sans enseignant
     * ne peut pas avoir eu lieu.
     */
    public void marquerEffectuee() {
        if (statut != StatutAffectation.ASSIGNEE) {
            throw new IllegalStateException(
                    "Impossible de marquer effectuée : le créneau est " + statut
                            + " (un enseignant doit être assigné au préalable)");
        }
        this.statut = StatutAffectation.EFFECTUEE;
    }

    /**
     * Annule le créneau. Autorisé depuis PLANIFIEE ou ASSIGNEE.
     * Refusé si déjà EFFECTUEE (déjà comptabilisé) ou déjà ANNULEE.
     */
    public void annuler() {
        if (statut == StatutAffectation.EFFECTUEE || statut == StatutAffectation.ANNULEE) {
            throw new IllegalStateException(
                    "Impossible d'annuler : le créneau est déjà " + statut);
        }
        this.statut = StatutAffectation.ANNULEE;
    }

    public UUID getId() {
        return id;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public UUID getSalleId() {
        return salleId;
    }

    public UUID getMatiereId() {
        return matiereId;
    }

    public UUID getEnseignantId() {
        return enseignantId;
    }

    public int getSeance() {
        return seance;
    }

    public int getSemaine() {
        return semaine;
    }

    public StatutAffectation getStatut() {
        return statut;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Affectation affectation)) return false;
        return Objects.equals(id, affectation.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}