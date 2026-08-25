package com.excelisprepas.backend.rattachement.domain.port.in;

import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;

import java.util.List;
import java.util.UUID;

public interface ListerRolesUseCase {
    List<AttributionRole> listerParUtilisateurEtSession(UUID utilisateurId, UUID sessionId);
}