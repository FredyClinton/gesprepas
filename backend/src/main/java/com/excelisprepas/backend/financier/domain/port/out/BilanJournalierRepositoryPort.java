package com.excelisprepas.backend.financier.domain.port.out;

import com.excelisprepas.backend.financier.domain.model.BilanJournalier;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface BilanJournalierRepositoryPort {
    BilanJournalier save(BilanJournalier bilan);

    Optional<BilanJournalier> findById(UUID id);

    Optional<BilanJournalier> findByCentreIdAndSessionIdAndDate(UUID centreId, UUID sessionId, LocalDate date);

    /**
     * Verrouille la journée de caisse (centre, session, date) jusqu'à la fin de la
     * transaction en cours. Toute écriture de mouvement et tout changement de statut
     * du bilan de cette journée doit le prendre d'abord : sans lui, un versement
     * vérifié "bilan non soumis" pouvait être enregistré juste après la soumission
     * ou la clôture du bilan, par une requête concurrente.
     */
    void verrouillerJournee(UUID centreId, UUID sessionId, LocalDate date);
}