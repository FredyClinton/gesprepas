package com.excelisprepas.backend.dossier.domain.model;

import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class PieceDossier {

    private final UUID id;
    private final UUID dossierConcoursId;
    private final UUID pieceRequiseId;
    private int quantite;
    private StatutPieceDossier statut;
    private LocalDate dateValidation;

    public PieceDossier(UUID id, UUID dossierConcoursId, UUID pieceRequiseId, int quantite) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.dossierConcoursId = Objects.requireNonNull(dossierConcoursId, "dossierConcoursId ne peut pas être nul");
        this.pieceRequiseId = Objects.requireNonNull(pieceRequiseId, "pieceRequiseId ne peut pas être nul");
        this.quantite = validerQuantite(quantite);
        this.statut = StatutPieceDossier.EN_ATTENTE;
        this.dateValidation = null;
    }

    private PieceDossier(UUID id, UUID dossierConcoursId, UUID pieceRequiseId, int quantite,
                         StatutPieceDossier statut, LocalDate dateValidation) {
        this.id = id;
        this.dossierConcoursId = dossierConcoursId;
        this.pieceRequiseId = pieceRequiseId;
        this.quantite = quantite;
        this.statut = statut;
        this.dateValidation = dateValidation;
    }

    public static PieceDossier reconstituer(UUID id, UUID dossierConcoursId, UUID pieceRequiseId, int quantite,
                                            StatutPieceDossier statut, LocalDate dateValidation) {
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        return new PieceDossier(id, dossierConcoursId, pieceRequiseId, quantite, statut, dateValidation);
    }

    private static int validerQuantite(int quantite) {
        if (quantite <= 0) {
            throw new IllegalArgumentException("quantite doit être strictement positive");
        }
        return quantite;
    }

    public void augmenterQuantite(int quantiteSupplementaire) {
        this.quantite += validerQuantite(quantiteSupplementaire);
    }

    public void valider(LocalDate dateValidation) {
        if (statut == StatutPieceDossier.VALIDEE) {
            throw new IllegalStateException("Cette pièce est déjà validée");
        }
        this.statut = StatutPieceDossier.VALIDEE;
        this.dateValidation = Objects.requireNonNull(dateValidation, "dateValidation ne peut pas être nulle");
    }

    public UUID getId() {
        return id;
    }

    public UUID getDossierConcoursId() {
        return dossierConcoursId;
    }

    public UUID getPieceRequiseId() {
        return pieceRequiseId;
    }

    public int getQuantite() {
        return quantite;
    }

    public StatutPieceDossier getStatut() {
        return statut;
    }

    public Optional<LocalDate> getDateValidation() {
        return Optional.ofNullable(dateValidation);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof PieceDossier that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}