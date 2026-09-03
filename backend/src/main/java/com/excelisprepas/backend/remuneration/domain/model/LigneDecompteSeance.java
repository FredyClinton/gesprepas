package com.excelisprepas.backend.remuneration.domain.model;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

public class LigneDecompteSeance {
    private final UUID affectationId;
    private final int semaine;
    private final Jour jour;
    private final BigDecimal tarifApplique;
    private final TypeLigneDecompte type;

    public LigneDecompteSeance(UUID affectationId, int semaine, Jour jour, BigDecimal tarifApplique, TypeLigneDecompte type) {
        this.affectationId = Objects.requireNonNull(affectationId, "affectationId ne peut pas être nul");
        this.semaine = semaine;
        this.jour = Objects.requireNonNull(jour, "jour ne peut pas être nul");
        this.tarifApplique = Objects.requireNonNull(tarifApplique, "tarifApplique ne peut pas être nul");
        this.type = Objects.requireNonNull(type, "type ne peut pas être nul");
    }

    public UUID getAffectationId() {
        return affectationId;
    }

    public int getSemaine() {
        return semaine;
    }

    public Jour getJour() {
        return jour;
    }

    public BigDecimal getTarifApplique() {
        return tarifApplique;
    }

    public TypeLigneDecompte getType() {
        return type;
    }
}
