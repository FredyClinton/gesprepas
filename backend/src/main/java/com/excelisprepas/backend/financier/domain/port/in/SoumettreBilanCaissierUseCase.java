package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;

import java.time.LocalDate;
import java.util.UUID;

public interface SoumettreBilanCaissierUseCase {
    BilanJournalier soumettreBilanCaissier(UUID centreId, UUID sessionId, LocalDate date, UUID caissierUtilisateurId);
}
