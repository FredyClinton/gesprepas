package com.excelisprepas.backend.remuneration.domain.model;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class LigneAjustementPaieEnseignant {
    private final UUID enseignantId;
    private final BigDecimal coutParSeance;
    private final List<UUID> affectationIds;

    public LigneAjustementPaieEnseignant(UUID enseignantId, BigDecimal coutParSeance, List<UUID> affectationIds) {
        this.enseignantId = Objects.requireNonNull(enseignantId, "enseignantId ne peut pas être nul");
        this.coutParSeance = Objects.requireNonNull(coutParSeance, "coutParSeance ne peut pas être nul");
        this.affectationIds = affectationIds != null ? List.copyOf(affectationIds) : Collections.emptyList();
    }

    public UUID getEnseignantId() {
        return enseignantId;
    }

    public BigDecimal getCoutParSeance() {
        return coutParSeance;
    }

    public List<UUID> getAffectationIds() {
        return affectationIds;
    }
}

