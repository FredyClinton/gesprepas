package com.excelisprepas.backend.remuneration.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class BordereauPaiePersonnel {
    private final UUID id;
    private final UUID sessionId;
    private final String reference;
    private final String intitule;
    private final LocalDate datePaiement;
    private final List<FichePaiePersonnel> fiches;
    private final int nombrePersonnelsPayes;
    private final BigDecimal montantTotalGlobal;
    private final UUID sortieId;
    private final String saisiPar;

    public BordereauPaiePersonnel(UUID id, UUID sessionId, String reference, String intitule,
                                  LocalDate datePaiement, List<FichePaiePersonnel> fiches,
                                  UUID sortieId, String saisiPar) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.reference = Objects.requireNonNull(reference, "reference ne peut pas être nulle");
        this.intitule = Objects.requireNonNull(intitule, "intitule ne peut pas être nul");
        this.datePaiement = Objects.requireNonNull(datePaiement, "datePaiement ne peut pas être nulle");
        this.fiches = fiches != null ? List.copyOf(fiches) : Collections.emptyList();
        this.sortieId = Objects.requireNonNull(sortieId, "sortieId ne peut pas être nul");
        this.saisiPar = Objects.requireNonNull(saisiPar, "saisiPar ne peut pas être nul");

        this.nombrePersonnelsPayes = this.fiches.size();
        this.montantTotalGlobal = this.fiches.stream()
                .map(FichePaiePersonnel::getMontantPaye)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BordereauPaiePersonnel(UUID id, UUID sessionId, String reference, String intitule,
                                  LocalDate datePaiement, List<FichePaiePersonnel> fiches,
                                  int nombrePersonnelsPayes, BigDecimal montantTotalGlobal,
                                  UUID sortieId, String saisiPar) {
        this.id = id;
        this.sessionId = sessionId;
        this.reference = reference;
        this.intitule = intitule;
        this.datePaiement = datePaiement;
        this.fiches = fiches != null ? List.copyOf(fiches) : Collections.emptyList();
        this.nombrePersonnelsPayes = nombrePersonnelsPayes;
        this.montantTotalGlobal = montantTotalGlobal;
        this.sortieId = sortieId;
        this.saisiPar = saisiPar;
    }

    public static BordereauPaiePersonnel reconstituer(UUID id, UUID sessionId, String reference, String intitule,
                                                       LocalDate datePaiement, List<FichePaiePersonnel> fiches,
                                                       int nombrePersonnelsPayes, BigDecimal montantTotalGlobal,
                                                       UUID sortieId, String saisiPar) {
        return new BordereauPaiePersonnel(id, sessionId, reference, intitule, datePaiement, fiches,
                nombrePersonnelsPayes, montantTotalGlobal, sortieId, saisiPar);
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

    public String getIntitule() {
        return intitule;
    }

    public LocalDate getDatePaiement() {
        return datePaiement;
    }

    public List<FichePaiePersonnel> getFiches() {
        return fiches;
    }

    public int getNombrePersonnelsPayes() {
        return nombrePersonnelsPayes;
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
