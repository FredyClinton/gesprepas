package com.excelisprepas.backend.shared.exception;

import java.time.LocalDate;
import java.util.UUID;

public class BilanJournalierDejaExistantException extends RuntimeException {
    public BilanJournalierDejaExistantException(UUID centreId, LocalDate date) {
        super("Un bilan journalier existe déjà pour le centre " + centreId + " à la date " + date);
    }
}