package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.BilanJournalierApercu;

import java.time.LocalDate;
import java.util.UUID;

public interface ConsulterBilanDuJourUseCase {
    BilanJournalierApercu consulterBilanDuJour(UUID centreId, UUID sessionId, LocalDate date);
}