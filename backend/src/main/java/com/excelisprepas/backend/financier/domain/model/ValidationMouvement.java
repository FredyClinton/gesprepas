package com.excelisprepas.backend.financier.domain.model;

import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

/**
 * Trace d'une décision individuelle du Contrôleur financier sur un
 * MouvementFinancier — qui a validé/rejeté, quand. Le statut résultant
 * (Valide/Rejete) est porté par le mouvement lui-même ; cette entité
 * n'est que l'audit de la décision.
 */
public class ValidationMouvement {

    private final UUID id;
    private final UUID mouvementFinancierId;
    private final UUID validateurUtilisateurId;
    private final StatutMouvement decision;
    private final LocalDateTime date;

    public ValidationMouvement(UUID id, UUID mouvementFinancierId, UUID validateurUtilisateurId,
                               StatutMouvement decision, LocalDateTime date) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.mouvementFinancierId = Objects.requireNonNull(mouvementFinancierId, "mouvementFinancierId ne peut pas être nul");
        this.validateurUtilisateurId = Objects.requireNonNull(validateurUtilisateurId, "validateurUtilisateurId ne peut pas être nul");
        this.decision = validerDecision(decision);
        this.date = Objects.requireNonNull(date, "date ne peut pas être nulle");
    }

    private static StatutMouvement validerDecision(StatutMouvement decision) {
        Objects.requireNonNull(decision, "decision ne peut pas être nulle");
        if (decision == StatutMouvement.EN_ATTENTE) {
            throw new IllegalArgumentException("decision doit être VALIDE ou REJETE, pas EN_ATTENTE");
        }
        return decision;
    }

    public UUID getId() {
        return id;
    }

    public UUID getMouvementFinancierId() {
        return mouvementFinancierId;
    }

    public UUID getValidateurUtilisateurId() {
        return validateurUtilisateurId;
    }

    public StatutMouvement getDecision() {
        return decision;
    }

    public LocalDateTime getDate() {
        return date;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof ValidationMouvement that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}