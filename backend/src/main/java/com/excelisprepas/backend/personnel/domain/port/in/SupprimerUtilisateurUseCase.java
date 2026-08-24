package com.excelisprepas.backend.personnel.domain.port.in;

import java.util.UUID;

public interface SupprimerUtilisateurUseCase {
    void supprimerUtilisateur(UUID id);
}