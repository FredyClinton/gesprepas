package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class Entree extends MouvementFinancier {

    private final UUID centreId;
    private final UUID apprenantId;
    private final UUID formationId;

    public Entree(UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                  UUID saisiParUtilisateurId, UUID centreId, UUID apprenantId, UUID formationId) {
        super(id, sessionId, motifId, montant, date, saisiParUtilisateurId, StatutMouvement.EN_ATTENTE, null);
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul pour une Entree");
        this.apprenantId = apprenantId;
        this.formationId = formationId;
    }

    private Entree(UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                   UUID saisiParUtilisateurId, StatutMouvement statut, UUID centreId, UUID apprenantId,
                   UUID formationId, UUID bilanJournalierId) {
        super(id, sessionId, motifId, montant, date, saisiParUtilisateurId, statut, bilanJournalierId);
        this.centreId = centreId;
        this.apprenantId = apprenantId;
        this.formationId = formationId;
    }

    public static Entree reconstituer(UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                                      UUID saisiParUtilisateurId, StatutMouvement statut, UUID centreId,
                                      UUID apprenantId, UUID formationId, UUID bilanJournalierId) {
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        Objects.requireNonNull(centreId, "centreId ne peut pas être nul pour une Entree");
        return new Entree(id, sessionId, motifId, montant, date, saisiParUtilisateurId, statut,
                centreId, apprenantId, formationId, bilanJournalierId);
    }

    public UUID getCentreId() {
        return centreId;
    }

    public Optional<UUID> getApprenantId() {
        return Optional.ofNullable(apprenantId);
    }

    public Optional<UUID> getFormationId() {
        return Optional.ofNullable(formationId);
    }
}