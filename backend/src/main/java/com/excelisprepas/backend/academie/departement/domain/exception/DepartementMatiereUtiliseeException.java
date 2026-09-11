package com.excelisprepas.backend.academie.departement.domain.exception;

import java.util.UUID;

public class DepartementMatiereUtiliseeException extends RuntimeException {
    public DepartementMatiereUtiliseeException(UUID departementId, UUID matiereId) {
        super("Impossible de supprimer ce département : sa matière est déjà utilisée dans des formations ou des créneaux de cours.");
    }
}

