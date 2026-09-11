package com.excelisprepas.backend.remuneration.domain.model;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class FichePaieEnseignant {
    private final UUID id;
    private final UUID bordereauPaieId;
    private final UUID enseignantId;
    private final List<LigneDecompteSeance> lignes;
    private final int nombreSeances;
    private final BigDecimal montantTotal;
    private StatutFichePaie statut;

    public FichePaieEnseignant(UUID id, UUID bordereauPaieId, UUID enseignantId, List<LigneDecompteSeance> lignes) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.bordereauPaieId = Objects.requireNonNull(bordereauPaieId, "bordereauPaieId ne peut pas être nul");
        this.enseignantId = Objects.requireNonNull(enseignantId, "enseignantId ne peut pas être nul");
        this.lignes = lignes != null ? List.copyOf(lignes) : Collections.emptyList();
        this.statut = StatutFichePaie.PROGRAMMEE;
        
        this.nombreSeances = this.lignes.size();
        this.montantTotal = this.lignes.stream()
                .map(LigneDecompteSeance::getTarifApplique)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private FichePaieEnseignant(UUID id, UUID bordereauPaieId, UUID enseignantId, List<LigneDecompteSeance> lignes, StatutFichePaie statut) {
        this.id = id;
        this.bordereauPaieId = bordereauPaieId;
        this.enseignantId = enseignantId;
        this.lignes = lignes != null ? List.copyOf(lignes) : Collections.emptyList();
        this.statut = statut != null ? statut : StatutFichePaie.PROGRAMMEE;
        
        this.nombreSeances = this.lignes.size();
        this.montantTotal = this.lignes.stream()
                .map(LigneDecompteSeance::getTarifApplique)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private FichePaieEnseignant(UUID id, UUID bordereauPaieId, UUID enseignantId, List<LigneDecompteSeance> lignes, int nombreSeances, BigDecimal montantTotal, StatutFichePaie statut) {
        this.id = id;
        this.bordereauPaieId = bordereauPaieId;
        this.enseignantId = enseignantId;
        this.lignes = lignes != null ? List.copyOf(lignes) : Collections.emptyList();
        this.nombreSeances = nombreSeances;
        this.montantTotal = montantTotal != null ? montantTotal : BigDecimal.ZERO;
        this.statut = statut != null ? statut : StatutFichePaie.PROGRAMMEE;
    }

    public static FichePaieEnseignant reconstituer(UUID id, UUID bordereauPaieId, UUID enseignantId, List<LigneDecompteSeance> lignes, StatutFichePaie statut) {
        return new FichePaieEnseignant(id, bordereauPaieId, enseignantId, lignes, statut);
    }

    public static FichePaieEnseignant reconstituer(UUID id, UUID bordereauPaieId, UUID enseignantId, List<LigneDecompteSeance> lignes, int nombreSeances, BigDecimal montantTotal, StatutFichePaie statut) {
        return new FichePaieEnseignant(id, bordereauPaieId, enseignantId, lignes, nombreSeances, montantTotal, statut);
    }

    public void executerPaiement() {
        if (this.statut == StatutFichePaie.PAYEE) {
            throw new IllegalStateException("La fiche est déjà payée.");
        }
        this.statut = StatutFichePaie.PAYEE;
    }

    public UUID getId() {
        return id;
    }

    public UUID getBordereauPaieId() {
        return bordereauPaieId;
    }

    public UUID getEnseignantId() {
        return enseignantId;
    }

    public List<LigneDecompteSeance> getLignes() {
        return lignes;
    }

    public int getNombreSeances() {
        return nombreSeances;
    }

    public BigDecimal getMontantTotal() {
        return montantTotal;
    }

    public StatutFichePaie getStatut() {
        return statut;
    }
}
