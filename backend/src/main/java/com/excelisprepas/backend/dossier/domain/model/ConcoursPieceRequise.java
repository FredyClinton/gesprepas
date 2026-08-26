package com.excelisprepas.backend.dossier.domain.model;

import java.util.Objects;
import java.util.UUID;

public class ConcoursPieceRequise {

    private final UUID id;
    private final UUID concoursId;
    private final UUID pieceRequiseId;

    public ConcoursPieceRequise(UUID id, UUID concoursId, UUID pieceRequiseId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.concoursId = Objects.requireNonNull(concoursId, "concoursId ne peut pas être nul");
        this.pieceRequiseId = Objects.requireNonNull(pieceRequiseId, "pieceRequiseId ne peut pas être nul");
    }

    public UUID getId() {
        return id;
    }

    public UUID getConcoursId() {
        return concoursId;
    }

    public UUID getPieceRequiseId() {
        return pieceRequiseId;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ConcoursPieceRequise that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}