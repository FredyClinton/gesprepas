package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "resultats_candidats_concours_blanc")
public class ResultatCandidatEntity {

    @Id
    private UUID id;

    @Column(name = "concours_blanc_id", nullable = false)
    private UUID concoursBlancId;

    @Column(name = "formation_id", nullable = false)
    private UUID formationId;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId;

    @Column(name = "apprenant_id")
    private UUID apprenantId;

    @Column(name = "nom_complet", nullable = false)
    private String nomComplet;

    @Column(name = "etablissement_origine")
    private String etablissementOrigine;

    @Column(name = "hors_liste", nullable = false)
    private boolean horsListe;

    @Column(name = "total_pondere", precision = 8, scale = 2)
    private BigDecimal totalPondere;

    @Column(name = "moyenne_ponderee", precision = 5, scale = 2)
    private BigDecimal moyennePonderee;

    private Integer rang;

    @Column(name = "rang_centre")
    private Integer rangCentre;

    @Column(name = "delta_rang")
    private Integer deltaRang;

    @OneToMany(mappedBy = "resultatCandidat", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<NoteEpreuveEntity> notes = new ArrayList<>();

    public ResultatCandidatEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getConcoursBlancId() { return concoursBlancId; }
    public void setConcoursBlancId(UUID concoursBlancId) { this.concoursBlancId = concoursBlancId; }
    public UUID getFormationId() { return formationId; }
    public void setFormationId(UUID formationId) { this.formationId = formationId; }
    public UUID getCentreId() { return centreId; }
    public void setCentreId(UUID centreId) { this.centreId = centreId; }
    public UUID getApprenantId() { return apprenantId; }
    public void setApprenantId(UUID apprenantId) { this.apprenantId = apprenantId; }
    public String getNomComplet() { return nomComplet; }
    public void setNomComplet(String nomComplet) { this.nomComplet = nomComplet; }
    public String getEtablissementOrigine() { return etablissementOrigine; }
    public void setEtablissementOrigine(String etablissementOrigine) { this.etablissementOrigine = etablissementOrigine; }
    public boolean isHorsListe() { return horsListe; }
    public void setHorsListe(boolean horsListe) { this.horsListe = horsListe; }
    public BigDecimal getTotalPondere() { return totalPondere; }
    public void setTotalPondere(BigDecimal totalPondere) { this.totalPondere = totalPondere; }
    public BigDecimal getMoyennePonderee() { return moyennePonderee; }
    public void setMoyennePonderee(BigDecimal moyennePonderee) { this.moyennePonderee = moyennePonderee; }
    public Integer getRang() { return rang; }
    public void setRang(Integer rang) { this.rang = rang; }
    public Integer getRangCentre() { return rangCentre; }
    public void setRangCentre(Integer rangCentre) { this.rangCentre = rangCentre; }
    public Integer getDeltaRang() { return deltaRang; }
    public void setDeltaRang(Integer deltaRang) { this.deltaRang = deltaRang; }
    public List<NoteEpreuveEntity> getNotes() { return notes; }
    public void setNotes(List<NoteEpreuveEntity> notes) { this.notes = notes; }
}

