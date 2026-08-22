package com.excelisprepas.backend.personnel.domain.model;

import java.util.Objects;
import java.util.UUID;

public abstract class Personnel {
    private final UUID id;
    private   String nom;
    private String prenom;
    private final ModeCalculPaie modeCalculPaie;

    protected Personnel(UUID id, String nom, String prenom,
                        ModeCalculPaie modeCalculPaie) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNonVide(nom, "nom");
        this.prenom = validerNonVide(prenom, "prenom");
        this.modeCalculPaie = Objects.requireNonNull(modeCalculPaie, "modeCalculPaie ne peut pas être nul");
    }

    private static String validerNonVide(String valeur, String champ) {
        if (valeur == null || valeur.isBlank()) {
            throw new IllegalArgumentException(champ + " ne peut pas être vide");
        }
        return valeur;
    }

    public void renommer(String nouveauNom, String nouveauPrenom) {
        this.nom = validerNonVide(nouveauNom, "nom");
        this.prenom = validerNonVide(nouveauPrenom, "prenom");
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



    public ModeCalculPaie getModeCalculPaie() {
        return modeCalculPaie;
    }

    public String getNomComplet() {
        return prenom + " " + nom;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Personnel)) return false;
        Personnel that = (Personnel) o;
        return id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return id.hashCode();
    }


}
