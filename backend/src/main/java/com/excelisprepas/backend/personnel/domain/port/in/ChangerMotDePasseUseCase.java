package com.excelisprepas.backend.personnel.domain.port.in;

import java.util.UUID;

public interface ChangerMotDePasseUseCase {
    void changerMotDePasse(UUID id, String nouveauMotDePasseClair);
}