package com.excelisprepas.backend.gelenseignants.domain.model;

import java.time.Instant;

/**
 * Interrupteur global, piloté par le Directeur Académique, qui retire au Chef de
 * Département la capacité de gérer les enseignants (création, édition, roster) tant
 * qu'il est actif. dateFin est optionnelle : sans elle, le gel reste effectif jusqu'à
 * désactivation manuelle.
 */
public class GelEnseignants {

    private final boolean actif;
    private final Instant dateFin;

    public GelEnseignants(boolean actif, Instant dateFin) {
        this.actif = actif;
        this.dateFin = dateFin;
    }

    public boolean isActif() {
        return actif;
    }

    public Instant getDateFin() {
        return dateFin;
    }

    public boolean estEffectif(Instant maintenant) {
        return actif && (dateFin == null || !maintenant.isAfter(dateFin));
    }
}
