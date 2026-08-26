package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;

import java.util.List;

public interface ListerMotifsUseCase {
    List<Motif> listerMotifs(TypeMotif typeOuNull);
}