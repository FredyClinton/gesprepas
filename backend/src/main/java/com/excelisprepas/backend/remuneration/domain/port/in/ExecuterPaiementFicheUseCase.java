package com.excelisprepas.backend.remuneration.domain.port.in;

import java.util.UUID;

public interface ExecuterPaiementFicheUseCase {
    void executerPaiement(UUID bordereauId, UUID ficheId, String executePar);
}
