package com.excelisprepas.backend.centre.domain.model;


import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class Centre {

    private final UUID id;
    private final List<LocalisationCentre> localisations = new ArrayList<>();
    private String nom;
    private StatutCentre statut;

    public Centre(UUID id, String nom, String adresseInitiale, String villeInitiale) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerChampObligatoire(nom, "nom");
        this.statut = StatutCentre.OUVERT;
        this.localisations.add(new LocalisationCentre(
                UUID.randomUUID(), adresseInitiale, villeInitiale, LocalDateTime.now(), null));
    }

    private Centre(UUID id, String nom, StatutCentre statut, List<LocalisationCentre> localisations) {
        this.id = id;
        this.nom = nom;
        this.statut = statut;
        this.localisations.addAll(localisations);
    }

    private static String validerChampObligatoire(String valeur, String nomChamp) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(nomChamp + " ne peut pas être vide");
        }
        return valeur;
    }

    /**
     * Reconstruction d'un Centre depuis la persistance.
     * Réservé aux adaptateurs infrastructure — ne jamais utiliser pour créer
     * un nouveau Centre (utiliser le constructeur public pour ça).
     */
    public static Centre reconstituer(UUID id, String nom, StatutCentre statut,
                                      List<LocalisationCentre> localisations) {
        Objects.requireNonNull(id, "id ne peut pas être nul");
        Objects.requireNonNull(nom, "nom ne peut pas être nul");
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        if (localisations == null || localisations.isEmpty()) {
            throw new IllegalArgumentException("localisations ne peut pas être vide à la reconstitution");
        }
        return new Centre(id, nom, statut, localisations);
    }

    public void relocaliser(String nouvelleAdresse, String nouvelleVille) {
        if (statut != StatutCentre.OUVERT) {
            throw new IllegalStateException("Impossible de relocaliser un centre fermé");
        }
        LocalDateTime maintenant = LocalDateTime.now();
        getLocalisationActuelle().cloturer(maintenant);
        localisations.add(new LocalisationCentre(
                UUID.randomUUID(), nouvelleAdresse, nouvelleVille, maintenant, null));
    }

    public void fermer() {
        if (statut == StatutCentre.FERME) {
            throw new IllegalStateException("Le centre '" + nom + "' est déjà fermé");
        }
        this.statut = StatutCentre.FERME;
    }

    public void rouvrir() {
        if (statut == StatutCentre.OUVERT) {
            throw new IllegalStateException("Le centre '" + nom + "' est déjà ouvert");
        }
        this.statut = StatutCentre.OUVERT;
    }

    public void renommer(String nouveauNom) {
        this.nom = validerChampObligatoire(nouveauNom, "nom");
    }

    public LocalisationCentre getLocalisationActuelle() {
        return localisations.stream()
                .filter(LocalisationCentre::estActive)
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Aucune localisation active — état incohérent"));
    }

    public List<LocalisationCentre> getHistoriqueLocalisations() {
        return List.copyOf(localisations);
    }

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public StatutCentre getStatut() {
        return statut;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Centre centre)) return false;
        return Objects.equals(id, centre.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
