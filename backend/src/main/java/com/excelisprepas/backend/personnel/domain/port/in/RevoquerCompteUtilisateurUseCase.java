package com.excelisprepas.backend.personnel.domain.port.in;

import java.util.UUID;

public interface RevoquerCompteUtilisateurUseCase {
    void revoquerCompte(UUID utilisateurId);
}
