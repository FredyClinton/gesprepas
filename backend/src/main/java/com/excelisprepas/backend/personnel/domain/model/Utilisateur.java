package com.excelisprepas.backend.personnel.domain.model;

import java.util.Objects;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Un Utilisateur : membre du Personnel administratif disposant d'un accès
 * connecté au système, avec un rôle applicatif et, optionnellement,
 * un centre de rattachement.
 */
public class Utilisateur extends Personnel {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private String motDePasseHash;
    private final RoleUtilisateur role;
    private UUID centreId; // nullable : rattachement optionnel

    public Utilisateur(UUID id, String nom, String prenom,
                       String email, String motDePasseHash, RoleUtilisateur role) {
        this(id, nom, prenom, null, null, email, motDePasseHash, role, null);
    }

    public Utilisateur(UUID id, String nom, String prenom,
                       String telephone, String numeroCni, String email,
                       String motDePasseHash, RoleUtilisateur role, UUID centreId) {
        super(id, nom, prenom, telephone, numeroCni, validerEmailObligatoire(email));
        this.motDePasseHash = validerMotDePasseHash(motDePasseHash);
        this.role = Objects.requireNonNull(role, "role ne peut pas être nul");
        this.centreId = centreId;
    }

    private static String validerEmailObligatoire(String email) {
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new IllegalArgumentException("email invalide : " + email);
        }
        return email;
    }

    private static String validerMotDePasseHash(String hash) {
        if (hash == null || hash.isBlank()) {
            throw new IllegalArgumentException("motDePasseHash ne peut pas être vide");
        }
        return hash;
    }

    public void changerEmail(String nouvelEmail) {
        setEmail(validerEmailObligatoire(nouvelEmail));
    }

    public void changerMotDePasseHash(String nouveauHash) {
        this.motDePasseHash = validerMotDePasseHash(nouveauHash);
    }

    public void rattacherACentre(UUID centreId) {
        this.centreId = centreId;
    }

    public void detacherDuCentre() {
        this.centreId = null;
    }

    public String getMotDePasseHash() {
        return motDePasseHash;
    }

    public RoleUtilisateur getRole() {
        return role;
    }

    public UUID getCentreId() {
        return centreId;
    }
}
