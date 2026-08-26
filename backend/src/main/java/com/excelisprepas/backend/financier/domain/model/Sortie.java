package com.excelisprepas.backend.financier.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

public class Sortie extends MouvementFinancier {

    private final UUID centreId;
    private final String ordonnateur;

    public Sortie(UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                  UUID saisiParUtilisateurId, UUID centreId, String ordonnateur) {
        super(id, sessionId, motifId, montant, date, saisiParUtilisateurId, StatutMouvement.EN_ATTENTE, null);
        this.centreId = centreId;
        this.ordonnateur = validerOrdonnateur(ordonnateur);
    }

    private Sortie(UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                   UUID saisiParUtilisateurId, StatutMouvement statut, UUID centreId, String ordonnateur,
                   UUID bilanJournalierId) {
        super(id, sessionId, motifId, montant, date, saisiParUtilisateurId, statut, bilanJournalierId);
        this.centreId = centreId;
        this.ordonnateur = ordonnateur;
    }

    public static Sortie reconstituer(UUID id, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                                      UUID saisiParUtilisateurId, StatutMouvement statut, UUID centreId,
                                      String ordonnateur, UUID bilanJournalierId) {
        Objects.requireNonNull(statut, "statut ne peut pas être nul");
        return new Sortie(id, sessionId, motifId, montant, date, saisiParUtilisateurId, statut,
                centreId, ordonnateur, bilanJournalierId);
    }

    private static String validerOrdonnateur(String ordonnateur) {
        if (ordonnateur == null || ordonnateur.isBlank()) {
            throw new IllegalArgumentException("ordonnateur ne peut pas être vide");
        }
        return ordonnateur;
    }

    public Optional<UUID> getCentreId() {
        return Optional.ofNullable(centreId);
    }

    public String getOrdonnateur() {
        return ordonnateur;
    }
}