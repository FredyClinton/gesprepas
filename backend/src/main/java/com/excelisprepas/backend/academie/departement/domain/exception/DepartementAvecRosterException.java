package com.excelisprepas.backend.academie.departement.domain.exception;

import java.util.UUID;

public class DepartementAvecRosterException extends RuntimeException {
    public DepartementAvecRosterException(UUID departementId) {
        super("Impossible de supprimer ce département : des enseignants y sont encore rattachés dans le roster.");
    }
}

