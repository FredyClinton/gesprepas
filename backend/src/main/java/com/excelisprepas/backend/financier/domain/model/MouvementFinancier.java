package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public abstract class MouvementFinancier {

    protected final UUID id;
    protected final UUID sessionId;
    protected final UUID motifId;
    protected final BigDecimal montant;
    protected final LocalDate date;
    protected final UUID saisiParUtilisateurId;
    protected StatutMouvement statut;
    protected UUID bilanJournalierId; // nullable — renseigné seulement à la clôture du bilan du jour

    protected MouvementFinancier(UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                                 UUID saisiParUtilisateurId, StatutMouvement statut, UUID bilanJournalierId) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.motifId = Objects.requireNonNull(motifId, "motifId ne peut pas être nul");
        this.montant = validerMontant(montant);
        this.date = Objects.requireNonNull(date, "date ne peut pas être nulle");
        this.saisiParUtilisateurId = Objects.requireNonNull(saisiParUtilisateurId, "saisiParUtilisateurId ne peut pas être nul");
        this.statut = Objects.requireNonNull(statut, "statut ne peut pas être nul");
        this.bilanJournalierId = bilanJournalierId;
    }

    private static BigDecimal validerMontant(BigDecimal montant) {
        if (montant == null || montant.signum() <= 0) {
            throw new IllegalArgumentException("montant doit être strictement positif");
        }
        return montant;
    }

    public void appliquerDecision(StatutMouvement decision) {
        if (this.statut != StatutMouvement.EN_ATTENTE) {
            throw new IllegalStateException(
                    "Ce mouvement a déjà été traité (statut actuel : " + this.statut + ")");
        }
        if (decision == StatutMouvement.EN_ATTENTE) {
            throw new IllegalArgumentException("La décision doit être VALIDE ou REJETE, pas EN_ATTENTE");
        }
        this.statut = decision;
    }

    public void rattacherABilan(UUID bilanJournalierId) {
        if (this.bilanJournalierId != null) {
            throw new IllegalStateException("Ce mouvement est déjà rattaché à un bilan");
        }
        if (this.statut != StatutMouvement.VALIDE) {
            throw new IllegalStateException("Seul un mouvement VALIDE peut être rattaché à un bilan");
        }
        this.bilanJournalierId = Objects.requireNonNull(bilanJournalierId, "bilanJournalierId ne peut pas être nul");
    }

    public UUID getId() {
        return id;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getMotifId() {
        return motifId;
    }

    public BigDecimal getMontant() {
        return montant;
    }

    public LocalDate getDate() {
        return date;
    }

    public UUID getSaisiParUtilisateurId() {
        return saisiParUtilisateurId;
    }

    public StatutMouvement getStatut() {
        return statut;
    }

    public Optional<UUID> getBilanJournalierId() {
        return Optional.ofNullable(bilanJournalierId);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof MouvementFinancier that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}