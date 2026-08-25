package com.excelisprepas.backend.affectationdepartementale.domain.port.in;

import java.util.UUID;

public interface RetirerEnseignantUseCase {
    void retirerEnseignant(UUID departementId, UUID sessionId, UUID enseignantId);
}