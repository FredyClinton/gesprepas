package com.excelisprepas.backend.dossier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public class DossierConcours {

    private final UUID id;
    private final UUID dossierId;
    private final UUID concoursId;
    private final UUID centreId;
    private final UUID sessionId;
    private final LocalDate dateAjout;
    private BigDecimal montantTotal;

    public DossierConcours(UUID id, UUID dossierId, UUID concoursId, UUID centreId, UUID sessionId, LocalDate dateAjout) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.dossierId = Objects.requireNonNull(dossierId, "dossierId ne peut pas être nul");
        this.concoursId = Objects.requireNonNull(concoursId, "concoursId ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.dateAjout = Objects.requireNonNull(dateAjout, "dateAjout ne peut pas être nulle");
        this.montantTotal = BigDecimal.ZERO;
    }

    private DossierConcours(UUID id, UUID dossierId, UUID concoursId, UUID centreId, UUID sessionId,
                            LocalDate dateAjout, BigDecimal montantTotal) {
        this.id = id;
        this.dossierId = dossierId;
        this.concoursId = concoursId;
        this.centreId = centreId;
        this.sessionId = sessionId;
        this.dateAjout = dateAjout;
        this.montantTotal = montantTotal;
    }

    public static DossierConcours reconstituer(UUID id, UUID dossierId, UUID concoursId, UUID centreId, UUID sessionId,
                                               LocalDate dateAjout, BigDecimal montantTotal) {
        return new DossierConcours(id, dossierId, concoursId, centreId, sessionId, dateAjout, montantTotal);
    }

    /**
     * Recalculé intégralement par le service à chaque ajout de pièce —
     * jamais incrémenté, pour éviter toute dérive (même principe que les
     * totaux de BilanJournalier).
     */
    public void redefinirMontantTotal(BigDecimal nouveauMontantTotal) {
        if (nouveauMontantTotal == null || nouveauMontantTotal.signum() < 0) {
            throw new IllegalArgumentException("montantTotal ne peut pas être négatif");
        }
        this.montantTotal = nouveauMontantTotal;
    }

    public UUID getId() {
        return id;
    }

    public UUID getDossierId() {
        return dossierId;
    }

    public UUID getConcoursId() {
        return concoursId;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public LocalDate getDateAjout() {
        return dateAjout;
    }

    public BigDecimal getMontantTotal() {
        return montantTotal;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DossierConcours that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}