package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.StatutConcoursBlanc;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "concours_blancs")
public class ConcoursBlancEntity {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false)
    private int numero;

    @Column(name = "date_epreuve", nullable = false)
    private LocalDate dateEpreuve;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Jour jour;

    @Column(nullable = false)
    private int semaine;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutConcoursBlanc statut;

    @Column(name = "seance_debut", nullable = false)
    private int seanceDebut;

    @Column(name = "seance_fin", nullable = false)
    private int seanceFin;

    @Column(name = "tous_les_centres", nullable = false)
    private boolean tousLesCentres = true;

    @Column(name = "saisie_notes_bloquee_centre", nullable = false)
    private boolean saisieNotesBloqueeCentre = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "concours_blancs_centres", joinColumns = @JoinColumn(name = "concours_blanc_id"))
    @Column(name = "centre_id")
    private List<UUID> centreIds = new ArrayList<>();

    @Column(name = "date_creation")
    private OffsetDateTime dateCreation;

    @OneToMany(mappedBy = "concoursBlanc", fetch = FetchType.LAZY)
    private List<EpreuveConcoursBlancEntity> epreuves = new ArrayList<>();

    public ConcoursBlancEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSessionId() { return sessionId; }
    public void setSessionId(UUID sessionId) { this.sessionId = sessionId; }
    public String getTitre() { return titre; }
    public void setTitre(String titre) { this.titre = titre; }
    public int getNumero() { return numero; }
    public void setNumero(int numero) { this.numero = numero; }
    public LocalDate getDateEpreuve() { return dateEpreuve; }
    public void setDateEpreuve(LocalDate dateEpreuve) { this.dateEpreuve = dateEpreuve; }
    public Jour getJour() { return jour; }
    public void setJour(Jour jour) { this.jour = jour; }
    public int getSemaine() { return semaine; }
    public void setSemaine(int semaine) { this.semaine = semaine; }
    public StatutConcoursBlanc getStatut() { return statut; }
    public void setStatut(StatutConcoursBlanc statut) { this.statut = statut; }
    public int getSeanceDebut() { return seanceDebut; }
    public void setSeanceDebut(int seanceDebut) { this.seanceDebut = seanceDebut; }
    public int getSeanceFin() { return seanceFin; }
    public void setSeanceFin(int seanceFin) { this.seanceFin = seanceFin; }
    public boolean isTousLesCentres() { return tousLesCentres; }
    public void setTousLesCentres(boolean tousLesCentres) { this.tousLesCentres = tousLesCentres; }
    public boolean isSaisieNotesBloqueeCentre() { return saisieNotesBloqueeCentre; }
    public void setSaisieNotesBloqueeCentre(boolean saisieNotesBloqueeCentre) { this.saisieNotesBloqueeCentre = saisieNotesBloqueeCentre; }
    public List<UUID> getCentreIds() { return centreIds; }
    public void setCentreIds(List<UUID> centreIds) { this.centreIds = centreIds; }
    public OffsetDateTime getDateCreation() { return dateCreation; }
    public void setDateCreation(OffsetDateTime dateCreation) { this.dateCreation = dateCreation; }
    public List<EpreuveConcoursBlancEntity> getEpreuves() { return epreuves; }
    public void setEpreuves(List<EpreuveConcoursBlancEntity> epreuves) { this.epreuves = epreuves; }
}

