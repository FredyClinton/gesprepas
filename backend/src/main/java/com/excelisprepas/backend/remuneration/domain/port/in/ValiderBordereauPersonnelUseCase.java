package com.excelisprepas.backend.remuneration.domain.port.in;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.model.LigneSaisiePaiePersonnel;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface ValiderBordereauPersonnelUseCase {
    BordereauPaiePersonnel validerBordereau(UUID sessionId, LocalDate datePaiement, String intitule,
                                            List<LigneSaisiePaiePersonnel> lignesSaisie, String saisiPar);
}
