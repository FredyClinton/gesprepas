package com.excelisprepas.backend.remuneration.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class BordereauPaie {
    private final UUID id;
    private final UUID sessionId;
    private final String reference;
    private final LocalDate datePaiement;
    private final List<FichePaieEnseignant> fiches;
    private final int nombreTotalEnseignants;
    private final int nombreTotalSeances;
    private final BigDecimal montantTotalGlobal;
    private final UUID sortieId;
    private final String saisiPar;

    public BordereauPaie(UUID id, UUID sessionId, String reference, LocalDate datePaiement, 
                         List<FichePaieEnseignant> fiches, UUID sortieId, String saisiPar) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.reference = Objects.requireNonNull(reference, "reference ne peut pas être nulle");
        this.datePaiement = Objects.requireNonNull(datePaiement, "datePaiement ne peut pas être nulle");
        this.fiches = fiches != null ? List.copyOf(fiches) : Collections.emptyList();
        this.sortieId = Objects.requireNonNull(sortieId, "sortieId ne peut pas être nul");
        this.saisiPar = Objects.requireNonNull(saisiPar, "saisiPar ne peut pas être nul");

        this.nombreTotalEnseignants = this.fiches.size();
        this.nombreTotalSeances = this.fiches.stream().mapToInt(FichePaieEnseignant::getNombreSeances).sum();
        this.montantTotalGlobal = this.fiches.stream()
                .map(FichePaieEnseignant::getMontantTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
    
    // Constructeur pour reconstitution
    private BordereauPaie(UUID id, UUID sessionId, String reference, LocalDate datePaiement, 
                         List<FichePaieEnseignant> fiches, int nombreTotalEnseignants, int nombreTotalSeances,
                         BigDecimal montantTotalGlobal, UUID sortieId, String saisiPar) {
        this.id = id;
        this.sessionId = sessionId;
        this.reference = reference;
        this.datePaiement = datePaiement;
        this.fiches = fiches != null ? List.copyOf(fiches) : Collections.emptyList();
        this.nombreTotalEnseignants = nombreTotalEnseignants;
        this.nombreTotalSeances = nombreTotalSeances;
        this.montantTotalGlobal = montantTotalGlobal;
        this.sortieId = sortieId;
        this.saisiPar = saisiPar;
    }
    
    public static BordereauPaie reconstituer(UUID id, UUID sessionId, String reference, LocalDate datePaiement, 
                         List<FichePaieEnseignant> fiches, int nombreTotalEnseignants, int nombreTotalSeances,
                         BigDecimal montantTotalGlobal, UUID sortieId, String saisiPar) {
        return new BordereauPaie(id, sessionId, reference, datePaiement, fiches, nombreTotalEnseignants, nombreTotalSeances, montantTotalGlobal, sortieId, saisiPar);
    }

    public UUID getId() {
        return id;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public String getReference() {
        return reference;
    }

    public LocalDate getDatePaiement() {
        return datePaiement;
    }

    public List<FichePaieEnseignant> getFiches() {
        return fiches;
    }

    public int getNombreTotalEnseignants() {
        return nombreTotalEnseignants;
    }

    public int getNombreTotalSeances() {
        return nombreTotalSeances;
    }

    public BigDecimal getMontantTotalGlobal() {
        return montantTotalGlobal;
    }

    public UUID getSortieId() {
        return sortieId;
    }

    public String getSaisiPar() {
        return saisiPar;
    }
}
