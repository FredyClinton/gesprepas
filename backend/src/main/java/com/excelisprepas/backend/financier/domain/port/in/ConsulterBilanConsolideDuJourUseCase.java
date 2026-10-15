package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.BilanConsolideNational;

import java.time.LocalDate;
import java.util.UUID;

public interface ConsulterBilanConsolideDuJourUseCase {
    BilanConsolideNational consulterBilanConsolide(UUID sessionId, LocalDate date);
}
