package com.excelisprepas.backend.academie.quota.domain.model;

import java.util.Objects;
import java.util.UUID;

/**
 * Nombre maximum de cours qu'un Chef de Département peut saisir (voir
 * Progression) pour une matière donnée, une semaine donnée, dans une formation
 * et une session académique données. Fixé par le Directeur Académique - tant
 * qu'aucun quota n'existe pour un triplet (formation, matière, semaine), la
 * saisie de progressions reste libre (voir ProgressionService).
 */
public class QuotaHebdomadaire {

    private final UUID id;
    private final UUID formationId;
    private final UUID sessionId;
    private final UUID matiereId;
    private final int semaine;
    private int quota;

    public QuotaHebdomadaire(UUID id, UUID formationId, UUID sessionId, UUID matiereId, int semaine, int quota) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.matiereId = Objects.requireNonNull(matiereId, "matiereId ne peut pas être nul");
        this.semaine = validerPositif(semaine, "semaine");
        this.quota = validerNonNegatif(quota, "quota");
    }

    private static int validerPositif(int valeur, String nomChamp) {
        if (valeur <= 0) {
            throw new IllegalArgumentException(nomChamp + " doit être strictement positif");
        }
        return valeur;
    }

    private static int validerNonNegatif(int valeur, String nomChamp) {
        if (valeur < 0) {
            throw new IllegalArgumentException(nomChamp + " ne peut pas être négatif");
        }
        return valeur;
    }

    public void modifier(int nouveauQuota) {
        this.quota = validerNonNegatif(nouveauQuota, "quota");
    }

    public UUID getId() {
        return id;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getMatiereId() {
        return matiereId;
    }

    public int getSemaine() {
        return semaine;
    }

    public int getQuota() {
        return quota;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof QuotaHebdomadaire that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
