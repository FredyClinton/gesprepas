package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class ContratEnseignantIntrouvableException extends RuntimeException {
    public ContratEnseignantIntrouvableException(UUID enseignantId, UUID sessionId) {
        super("Aucun contrat trouvé pour l'enseignant " + enseignantId + " sur la session " + sessionId);
    }
}