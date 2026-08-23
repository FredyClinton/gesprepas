package com.excelisprepas.backend.centre.domain.model;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Une LocalisationCentre : adresse d'un Centre valide sur une période donnée.
 * Objet enfant de l'agrégat Centre — jamais créé/modifié directement,
 * uniquement via Centre.relocaliser().
 */
public class LocalisationCentre {

    private final UUID id;
    private final String adresse;
    private final String ville;
    private final LocalDateTime dateDebutValidite;
    private LocalDateTime dateFinValidite; // null = actuellement active

    public LocalisationCentre(UUID id, String adresse, String ville,
                              LocalDateTime dateDebutValidite, LocalDateTime dateFinValidite) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.adresse = validerChampObligatoire(adresse, "adresse");
        this.ville = validerChampObligatoire(ville, "ville");
        this.dateDebutValidite = Objects.requireNonNull(dateDebutValidite, "dateDebutValidite ne peut pas être nulle");
        this.dateFinValidite = dateFinValidite;
    }

    private static String validerChampObligatoire(String valeur, String nomChamp) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(nomChamp + " ne peut pas être vide");
        }
        return valeur;
    }

    public void cloturer(LocalDateTime dateFin) {
        if (!estActive()) {
            throw new IllegalStateException("Cette localisation est déjà close");
        }
        this.dateFinValidite = Objects.requireNonNull(dateFin, "dateFin ne peut pas être nulle");
    }

    public boolean estActive() {
        return dateFinValidite == null;
    }

    public UUID getId() {
        return id;
    }

    public String getAdresse() {
        return adresse;
    }

    public String getVille() {
        return ville;
    }

    public LocalDateTime getDateDebutValidite() {
        return dateDebutValidite;
    }

    public LocalDateTime getDateFinValidite() {
        return dateFinValidite;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LocalisationCentre that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
