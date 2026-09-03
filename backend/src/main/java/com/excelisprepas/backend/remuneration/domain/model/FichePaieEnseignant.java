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

    public FichePaieEnseignant(UUID id, UUID bordereauPaieId, UUID enseignantId, List<LigneDecompteSeance> lignes) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.bordereauPaieId = Objects.requireNonNull(bordereauPaieId, "bordereauPaieId ne peut pas être nul");
        this.enseignantId = Objects.requireNonNull(enseignantId, "enseignantId ne peut pas être nul");
        this.lignes = lignes != null ? List.copyOf(lignes) : Collections.emptyList();
        
        this.nombreSeances = this.lignes.size();
        this.montantTotal = this.lignes.stream()
                .map(LigneDecompteSeance::getTarifApplique)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
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
}
