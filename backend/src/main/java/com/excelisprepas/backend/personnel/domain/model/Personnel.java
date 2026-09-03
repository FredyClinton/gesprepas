package com.excelisprepas.backend.personnel.domain.model;

import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

public class Personnel {
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private final UUID id;
    private String nom;
    private String prenom;
    private String telephone;
    private String numeroCni;
    private String email;

    public Personnel(UUID id, String nom, String prenom) {
        this(id, nom, prenom, null, null, null);
    }

    public Personnel(UUID id, String nom, String prenom, String telephone, String numeroCni, String email) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNonVide(nom, "nom");
        this.prenom = validerNonVide(prenom, "prenom");
        this.telephone = telephone;
        this.numeroCni = numeroCni;
        this.email = validerEmailOptionnel(email);
    }

    private static String validerNonVide(String valeur, String champ) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(champ + " ne peut pas être vide");
        }
        return valeur;
    }

    protected static String validerEmailOptionnel(String email) {
        if (email != null && !email.isBlank()) {
            if (!EMAIL_PATTERN.matcher(email).matches()) {
                throw new IllegalArgumentException("email invalide : " + email);
            }
            return email;
        }
        return null;
    }

    public void renommer(String nouveauNom, String nouveauPrenom) {
        this.nom = validerNonVide(nouveauNom, "nom");
        this.prenom = validerNonVide(nouveauPrenom, "prenom");
    }

    public void modifierCoordonnees(String telephone, String numeroCni, String email) {
        this.telephone = telephone;
        this.numeroCni = numeroCni;
        this.email = validerEmailOptionnel(email);
    }

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public String getPrenom() {
        return prenom;
    }

    public String getTelephone() {
        return telephone;
    }

    public void setTelephone(String telephone) {
        this.telephone = telephone;
    }

    public String getNumeroCni() {
        return numeroCni;
    }

    public void setNumeroCni(String numeroCni) {
        this.numeroCni = numeroCni;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = validerEmailOptionnel(email);
    }

    public String getNomComplet() {
        return prenom + " " + nom;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Personnel that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
