package com.excelisprepas.backend.academie.formation.domain.model;

import java.util.*;

public class Formation {

    private final UUID id;
    private String nom;
    private final Set<UUID> matiereIds = new LinkedHashSet<>();

    public Formation(UUID id, String nom) {
        this(id, nom, Collections.emptySet());
    }

    public Formation(UUID id, String nom, Set<UUID> matiereIds) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.nom = validerNom(nom);
        if (matiereIds != null) {
            this.matiereIds.addAll(matiereIds);
        }
    }

    private static String validerNom(String nom) {
        if (nom == null || nom.isBlank()) {
            throw new IllegalArgumentException("nom ne peut pas être vide");
        }
        return nom;
    }

    public void renommer(String nouveauNom) {
        this.nom = validerNom(nouveauNom);
    }

    public void ajouterMatiere(UUID matiereId) {
        Objects.requireNonNull(matiereId, "matiereId ne peut pas être nul");
        this.matiereIds.add(matiereId);
    }

    public void retirerMatiere(UUID matiereId) {
        Objects.requireNonNull(matiereId, "matiereId ne peut pas être nul");
        this.matiereIds.remove(matiereId);
    }

    public boolean contientMatiere(UUID matiereId) {
        return matiereId != null && this.matiereIds.contains(matiereId);
    }

    public UUID getId() {
        return id;
    }

    public String getNom() {
        return nom;
    }

    public Set<UUID> getMatiereIds() {
        return Collections.unmodifiableSet(matiereIds);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Formation formation)) return false;
        return Objects.equals(id, formation.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
