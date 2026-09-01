package com.excelisprepas.backend.academie.affectation.domain.model;

import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public class Affectation {

    private static final Set<StatutAffectation> STATUTS_ASSIGNABLES =
            Set.of(StatutAffectation.PLANIFIEE, StatutAffectation.ASSIGNEE);
    private final UUID id;
    private final UUID centreId;
    private final UUID sessionId;
    private final UUID formationId;
    private final UUID salleId;
    private UUID matiereId;
    private final Jour jour;
    private final int seance;
    private final int semaine;
    private UUID enseignantId;
    private StatutAffectation statut;

    public Affectation(UUID id, UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                       UUID enseignantId, Jour jour, int seance, int semaine, StatutAffectation statut) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
        this.salleId = Objects.requireNonNull(salleId, "salleId ne peut pas être nul");
        this.matiereId = Objects.requireNonNull(matiereId, "matiereId ne peut pas être nul");
        this.enseignantId = enseignantId; // nullable : pas encore assigné à la création
        this.jour = Objects.requireNonNull(jour, "jour ne peut pas être nul");
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

    public void assignerEnseignant(UUID enseignantId) {
        if (!STATUTS_ASSIGNABLES.contains(statut)) {
            throw new IllegalStateException(
                    "Impossible d'assigner un enseignant : le créneau est " + statut);
        }
        this.enseignantId = Objects.requireNonNull(enseignantId, "enseignantId ne peut pas être nul");
        this.statut = StatutAffectation.ASSIGNEE;
    }

    public void marquerEffectuee() {
        if (statut != StatutAffectation.ASSIGNEE) {
            throw new IllegalStateException(
                    "Impossible de marquer effectuée : le créneau est " + statut
                            + " (un enseignant doit être assigné au préalable)");
        }
        this.statut = StatutAffectation.EFFECTUEE;
    }

    // Rétro-action : permet d'annuler un marquage "effectuée" fait par erreur, en
    // revenant à ASSIGNEE (l'enseignant reste assigné, seul le statut change).
    public void annulerEffectuee() {
        if (statut != StatutAffectation.EFFECTUEE) {
            throw new IllegalStateException(
                    "Impossible d'annuler le marquage effectuée : le créneau est " + statut);
        }
        this.statut = StatutAffectation.ASSIGNEE;
    }

    // Libère le créneau d'un enseignant suspendu (ou retiré autrement) : redevient
    // PLANIFIEE, prêt à être réassigné. Une séance déjà EFFECTUEE n'est jamais
    // touchée par cette opération.
    public void desassignerEnseignant() {
        if (statut != StatutAffectation.ASSIGNEE) {
            throw new IllegalStateException(
                    "Impossible de désassigner : le créneau est " + statut);
        }
        this.enseignantId = null;
        this.statut = StatutAffectation.PLANIFIEE;
    }

    public void modifierMatiere(UUID nouvelleMatiereId) {
        if (statut == StatutAffectation.EFFECTUEE || statut == StatutAffectation.ANNULEE) {
            throw new IllegalStateException(
                    "Impossible de modifier la matière : le créneau est " + statut);
        }
        this.matiereId = Objects.requireNonNull(nouvelleMatiereId, "matiereId ne peut pas être nul");
        // Changer de matière invalide l'assignation existante (décision du 30/08/2026).
        this.enseignantId = null;
        this.statut = StatutAffectation.PLANIFIEE;
    }

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

    public UUID getSessionId() {
        return sessionId;
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

    public Jour getJour() {
        return jour;
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