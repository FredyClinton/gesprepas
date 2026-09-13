package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "epreuves_concours_blanc")
public class EpreuveConcoursBlancEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "concours_blanc_id", nullable = false)
    private ConcoursBlancEntity concoursBlanc;

    @Column(name = "formation_id", nullable = false)
    private UUID formationId;

    @Column(name = "matiere_id", nullable = false)
    private UUID matiereId;

    private String intitule;

    @Column(name = "duree_minutes", nullable = false)
    private int dureeMinutes;

    @Column(name = "note_max", nullable = false, precision = 5, scale = 2)
    private BigDecimal noteMax;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal coefficient;

    @Column(name = "contenu_evaluation", columnDefinition = "TEXT")
    private String contenuEvaluation;

    @Column(columnDefinition = "TEXT")
    private String consignes;

    @Column(name = "date_creation")
    private OffsetDateTime dateCreation;

    public EpreuveConcoursBlancEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ConcoursBlancEntity getConcoursBlanc() { return concoursBlanc; }
    public void setConcoursBlanc(ConcoursBlancEntity concoursBlanc) { this.concoursBlanc = concoursBlanc; }
    public UUID getFormationId() { return formationId; }
    public void setFormationId(UUID formationId) { this.formationId = formationId; }
    public UUID getMatiereId() { return matiereId; }
    public void setMatiereId(UUID matiereId) { this.matiereId = matiereId; }
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
    public OffsetDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(OffsetDateTime dateCreation) { this.dateCreation = dateCreation; }
}

