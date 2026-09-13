package com.excelisprepas.backend.academie.concoursblanc.domain.model;

import java.math.BigDecimal;
import java.util.Objects;
import java.util.UUID;

public class EpreuveConcoursBlanc {
    private final UUID id;
    private final UUID concoursBlancId;
    private final UUID formationId;
    private final UUID matiereId;
    private String intitule;
    private int dureeMinutes;
    private BigDecimal noteMax;
    private BigDecimal coefficient;
    private String contenuEvaluation;
    private String consignes;

    public EpreuveConcoursBlanc(UUID id, UUID concoursBlancId, UUID formationId, UUID matiereId,
                               String intitule, int dureeMinutes, BigDecimal noteMax, BigDecimal coefficient,
                               String contenuEvaluation, String consignes) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.concoursBlancId = Objects.requireNonNull(concoursBlancId, "concoursBlancId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
        this.matiereId = Objects.requireNonNull(matiereId, "matiereId ne peut pas être nul");
        this.intitule = intitule != null ? intitule : "";
        this.dureeMinutes = dureeMinutes > 0 ? dureeMinutes : 120;
        this.noteMax = noteMax != null && noteMax.signum() > 0 ? noteMax : BigDecimal.valueOf(20);
        this.coefficient = coefficient != null && coefficient.signum() > 0 ? coefficient : BigDecimal.ONE;
        this.contenuEvaluation = contenuEvaluation;
        this.consignes = consignes;
    }

    public UUID getId() { return id; }
    public UUID getConcoursBlancId() { return concoursBlancId; }
    public UUID getFormationId() { return formationId; }
    public UUID getMatiereId() { return matiereId; }
    public String getIntitule() { return intitule; }
    public void setIntitule(String intitule) { this.intitule = intitule; }
    public int getDureeMinutes() { return dureeMinutes; }
    public void setDureeMinutes(int dureeMinutes) { this.dureeMinutes = dureeMinutes; }
    public BigDecimal getNoteMax() { return noteMax; }
    public void setNoteMax(BigDecimal noteMax) { this.noteMax = noteMax; }
    public BigDecimal getCoefficient() { return coefficient; }
    public void setCoefficient(BigDecimal coefficient) { this.coefficient = coefficient; }
    public String getContenuEvaluation() { return contenuEvaluation; }
    public void setContenuEvaluation(String contenuEvaluation) { this.contenuEvaluation = contenuEvaluation; }
    public String getConsignes() { return consignes; }
    public void setConsignes(String consignes) { this.consignes = consignes; }
}

