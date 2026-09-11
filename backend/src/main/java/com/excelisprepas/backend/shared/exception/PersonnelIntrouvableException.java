package com.excelisprepas.backend.shared.exception;

import java.util.UUID;

public class PersonnelIntrouvableException extends RuntimeException {
    public PersonnelIntrouvableException(UUID id) {
        super("Aucun membre du personnel trouvé avec l'id : " + id);
    }
}

