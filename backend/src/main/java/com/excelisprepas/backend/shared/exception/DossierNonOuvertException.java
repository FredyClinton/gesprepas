package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class DossierNonOuvertException extends RuntimeException {
    public DossierNonOuvertException(UUID dossierId) {
        super("Le dossier " + dossierId + " n'est plus ouvert (Complet ou Cloture) — aucune modification possible");
    }
}