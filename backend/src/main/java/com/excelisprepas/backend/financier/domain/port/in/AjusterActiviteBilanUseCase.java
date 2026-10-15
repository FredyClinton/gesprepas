package com.excelisprepas.backend.financier.domain.port.in;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;
import java.time.LocalDate;
import java.util.UUID;

public interface AjusterActiviteBilanUseCase {
    BilanJournalier ajusterActivite(UUID centreId, UUID sessionId, LocalDate date,
                                   int nombreSalles, int nombreCours, UUID utilisateurId);
}
