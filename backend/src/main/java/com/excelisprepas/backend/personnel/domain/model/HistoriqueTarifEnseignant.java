package com.excelisprepas.backend.personnel.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.UUID;

public class HistoriqueTarifEnseignant {

    private final UUID id;
    private final UUID enseignantId;
    private final UUID sessionId;
    private final int semaineDebut;
    private final int semaineFin;
    private final BigDecimal coutParSeance;
    private final LocalDateTime dateModification;

    public HistoriqueTarifEnseignant(UUID id, UUID enseignantId, UUID sessionId, int semaineDebut, int semaineFin, BigDecimal coutParSeance) {
        this(id, enseignantId, sessionId, semaineDebut, semaineFin, coutParSeance, LocalDateTime.now());
    }

    private HistoriqueTarifEnseignant(UUID id, UUID enseignantId, UUID sessionId, int semaineDebut, int semaineFin, BigDecimal coutParSeance, LocalDateTime dateModification) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.enseignantId = Objects.requireNonNull(enseignantId, "enseignantId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.semaineDebut = validerPositif(semaineDebut, "semaineDebut");
        this.semaineFin = validerSemaineFin(semaineDebut, semaineFin);
        this.coutParSeance = validerCout(coutParSeance);
        this.dateModification = dateModification != null ? dateModification : LocalDateTime.now();
    }

    public static HistoriqueTarifEnseignant reconstituer(UUID id, UUID enseignantId, UUID sessionId, int semaineDebut, int semaineFin, BigDecimal coutParSeance, LocalDateTime dateModification) {
        return new HistoriqueTarifEnseignant(id, enseignantId, sessionId, semaineDebut, semaineFin, coutParSeance, dateModification);
    }

    private static int validerPositif(int valeur, String nomChamp) {
        if (valeur <= 0) {
            throw new IllegalArgumentException(nomChamp + " doit être strictement positif");
        }
        return valeur;
    }

    private static int validerSemaineFin(int semaineDebut, int semaineFin) {
        validerPositif(semaineFin, "semaineFin");
        if (semaineFin < semaineDebut) {
            throw new IllegalArgumentException("semaineFin doit être supérieure ou égale à semaineDebut");
        }
        return semaineFin;
    }

    private static BigDecimal validerCout(BigDecimal cout) {
        Objects.requireNonNull(cout, "coutParSeance ne peut pas être nul");
        if (cout.signum() < 0) {
            throw new IllegalArgumentException("coutParSeance ne peut pas être négatif");
        }
        return cout;
    }

    public UUID getId() {
        return id;
    }

    public UUID getEnseignantId() {
        return enseignantId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public int getSemaineDebut() {
        return semaineDebut;
    }

    public int getSemaineFin() {
        return semaineFin;
    }

    public BigDecimal getCoutParSeance() {
        return coutParSeance;
    }

    public LocalDateTime getDateModification() {
        return dateModification;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof HistoriqueTarifEnseignant that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
