package com.excelisprepas.backend.inscription.domain.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class DossierInscription {
    private final UUID id;
    private final UUID apprenantId;
    private final UUID sessionId;
    private final UUID centreId;
    private BigDecimal montantGlobal;
    private final LocalDate dateInscription;
    private final Boolean preInscrit;
    private final String referenceRecu;
    private List<UUID> phasesSouscrites;
    private List<UUID> formationsCibles;
    private List<UUID> concoursCibles;

    public DossierInscription(UUID id, UUID apprenantId, UUID sessionId, UUID centreId, BigDecimal montantGlobal,
                              LocalDate dateInscription, Boolean preInscrit, String referenceRecu,
                              List<UUID> phasesSouscrites, List<UUID> formationsCibles, List<UUID> concoursCibles) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.apprenantId = Objects.requireNonNull(apprenantId, "apprenantId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.montantGlobal = validerMontant(montantGlobal);
        this.dateInscription = Objects.requireNonNull(dateInscription, "dateInscription ne peut pas être nulle");
        this.preInscrit = preInscrit != null ? preInscrit : false;
        
        if (this.preInscrit && (referenceRecu == null || referenceRecu.isBlank())) {
            throw new IllegalArgumentException("La référence du reçu est obligatoire pour un pré-inscrit");
        }
        this.referenceRecu = this.preInscrit ? referenceRecu : null;
        
        this.phasesSouscrites = validerListeNonVide(phasesSouscrites, "phasesSouscrites");
        this.formationsCibles = validerListeNonVide(formationsCibles, "formationsCibles");
        this.concoursCibles = concoursCibles != null ? List.copyOf(concoursCibles) : List.of();
    }

    private static BigDecimal validerMontant(BigDecimal montant) {
        if (montant == null || montant.signum() < 0) {
            throw new IllegalArgumentException("montantGlobal ne peut pas être négatif");
        }
        return montant;
    }

    private static List<UUID> validerListeNonVide(List<UUID> liste, String nomChamp) {
        if (liste == null || liste.isEmpty()) {
            throw new IllegalArgumentException(nomChamp + " ne peut pas être vide");
        }
        return List.copyOf(liste);
    }

    public UUID getId() {
        return id;
    }

    public UUID getApprenantId() {
        return apprenantId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public BigDecimal getMontantGlobal() {
        return montantGlobal;
    }

    public LocalDate getDateInscription() {
        return dateInscription;
    }

    public Boolean getPreInscrit() {
        return preInscrit;
    }

    public String getReferenceRecu() {
        return referenceRecu;
    }

    public List<UUID> getPhasesSouscrites() {
        return phasesSouscrites;
    }

    public List<UUID> getFormationsCibles() {
        return formationsCibles;
    }

    public List<UUID> getConcoursCibles() {
        return concoursCibles;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof DossierInscription that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
