package com.excelisprepas.backend.personnel.domain.model;

public enum RoleUtilisateur {
    DIRECTEUR(false),
    DIRECTEUR_ACADEMIQUE(false),
    CHEF_CENTRE(true),
    CHEF_DEPARTEMENT(false),
    CHARGE_DOSSIER(true),
    SUPERVISEUR_DOSSIERS(false),
    CAISSIER(true),
    COMPTABLE(false);

    private final boolean centreScope;

    RoleUtilisateur(boolean centreScope) {
        this.centreScope = centreScope;
    }

    public boolean estCentreScope() {
        return centreScope;
    }
}
