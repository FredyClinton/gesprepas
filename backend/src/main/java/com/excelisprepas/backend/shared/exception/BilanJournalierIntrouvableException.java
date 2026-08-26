package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class BilanJournalierIntrouvableException extends RuntimeException {
    public BilanJournalierIntrouvableException(UUID id) {
        super("Aucun bilan journalier trouvé avec l'id : " + id);
    }
}