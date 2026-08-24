package com.excelisprepas.backend.affectation.domain.model;

import java.util.Objects;
import java.util.UUID;

public class Affectation {

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

    public void assignerEnseignant(UUID enseignantId) {
        this.enseignantId = Objects.requireNonNull(enseignantId, "enseignantId ne peut pas être nul");
        this.statut = StatutAffectation.ASSIGNEE;
    }

    public void marquerEffectuee() {
        this.statut = StatutAffectation.EFFECTUEE;
    }

    public void annuler() {
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