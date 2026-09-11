package com.excelisprepas.backend.remuneration.domain.port.in;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;
import com.excelisprepas.backend.remuneration.domain.model.LigneAjustementPaieEnseignant;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ValiderBordereauPaieUseCase {
    BordereauPaie valider(BordereauPaie bordereauSimule);

    BordereauPaie validerBordereau(UUID sessionId, LocalDate datePaiement, String reference,
                                   List<LigneAjustementPaieEnseignant> lignes, String saisiPar);
}
