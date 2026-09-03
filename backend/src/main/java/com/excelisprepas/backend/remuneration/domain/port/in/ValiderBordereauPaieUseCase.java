package com.excelisprepas.backend.remuneration.domain.port.in;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;



public interface ValiderBordereauPaieUseCase {
    BordereauPaie valider(BordereauPaie bordereauSimule);
}
