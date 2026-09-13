package com.excelisprepas.backend.academie.concoursblanc.domain.model;

import java.math.BigDecimal;
import java.util.*;

public class ResultatCandidat {
    private final UUID id;
    private final UUID concoursBlancId;
    private final UUID formationId;
    private final UUID centreId;
    private final UUID apprenantId; // nullable si candidat libre / hors-liste
    private String nomComplet;
    private String etablissementOrigine;
    private boolean horsListe;
    private List<NoteEpreuve> notes;
    private BigDecimal totalPondere;
    private BigDecimal moyennePonderee;
    private Integer rang;
    private Integer rangCentre;
    private Integer deltaRang;

    public ResultatCandidat(UUID id, UUID concoursBlancId, UUID formationId, UUID centreId,
                            UUID apprenantId, String nomComplet, String etablissementOrigine,
                            boolean horsListe, List<NoteEpreuve> notes) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.concoursBlancId = Objects.requireNonNull(concoursBlancId, "concoursBlancId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.apprenantId = apprenantId;
        this.nomComplet = nomComplet != null ? nomComplet : "";
        this.etablissementOrigine = etablissementOrigine;
        this.horsListe = horsListe;
        this.notes = notes != null ? new ArrayList<>(notes) : new ArrayList<>();
    }

    public UUID getId() { return id; }
    public UUID getConcoursBlancId() { return concoursBlancId; }
    public UUID getFormationId() { return formationId; }
    public UUID getCentreId() { return centreId; }
    public UUID getApprenantId() { return apprenantId; }
    public String getNomComplet() { return nomComplet; }
    public void setNomComplet(String nomComplet) { this.nomComplet = nomComplet; }
    public String getEtablissementOrigine() { return etablissementOrigine; }
    public void setEtablissementOrigine(String etablissementOrigine) { this.etablissementOrigine = etablissementOrigine; }
    public boolean isHorsListe() { return horsListe; }
    public void setHorsListe(boolean horsListe) { this.horsListe = horsListe; }
    public List<NoteEpreuve> getNotes() { return notes; }
    public void setNotes(List<NoteEpreuve> notes) { this.notes = notes; }
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
}

