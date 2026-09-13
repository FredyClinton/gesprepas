package com.excelisprepas.backend.academie.concoursblanc.domain.model;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class ConcoursBlanc {
    private final UUID id;
    private final UUID sessionId;
    private String titre;
    private int numero;
    private LocalDate dateEpreuve;
    private Jour jour;
    private int semaine;
    private StatutConcoursBlanc statut;
    private int seanceDebut;
    private int seanceFin;
    private boolean tousLesCentres;
    private List<UUID> centreIds;
    private boolean saisieNotesBloqueeCentre;
    private List<EpreuveConcoursBlanc> epreuves;

    public ConcoursBlanc(UUID id, UUID sessionId, String titre, int numero,
                         LocalDate dateEpreuve, Jour jour, int semaine,
                         StatutConcoursBlanc statut, int seanceDebut, int seanceFin) {
        this(id, sessionId, titre, numero, dateEpreuve, jour, semaine, statut, seanceDebut, seanceFin, true, new ArrayList<>(), false);
    }

    public ConcoursBlanc(UUID id, UUID sessionId, String titre, int numero,
                         LocalDate dateEpreuve, Jour jour, int semaine,
                         StatutConcoursBlanc statut, int seanceDebut, int seanceFin,
                         boolean tousLesCentres, List<UUID> centreIds) {
        this(id, sessionId, titre, numero, dateEpreuve, jour, semaine, statut, seanceDebut, seanceFin, tousLesCentres, centreIds, false);
    }

    public ConcoursBlanc(UUID id, UUID sessionId, String titre, int numero,
                         LocalDate dateEpreuve, Jour jour, int semaine,
                         StatutConcoursBlanc statut, int seanceDebut, int seanceFin,
                         boolean tousLesCentres, List<UUID> centreIds, boolean saisieNotesBloqueeCentre) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.titre = titre != null && !titre.isBlank() ? titre : "Concours Blanc N°" + numero;
        this.numero = numero > 0 ? numero : 1;
        this.dateEpreuve = Objects.requireNonNull(dateEpreuve, "dateEpreuve ne peut pas être nulle");
        this.jour = Objects.requireNonNull(jour, "jour ne peut pas être nul");
        this.semaine = semaine > 0 ? semaine : 1;
        this.statut = statut != null ? statut : StatutConcoursBlanc.PROGRAMME;
        this.seanceDebut = seanceDebut > 0 ? seanceDebut : 1;
        this.seanceFin = seanceFin >= this.seanceDebut ? seanceFin : 3;
        this.tousLesCentres = tousLesCentres;
        this.centreIds = centreIds != null ? new ArrayList<>(centreIds) : new ArrayList<>();
        this.saisieNotesBloqueeCentre = saisieNotesBloqueeCentre;
        this.epreuves = new ArrayList<>();
    }

    public UUID getId() { return id; }
    public UUID getSessionId() { return sessionId; }
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
    public List<UUID> getCentreIds() { return centreIds; }
    public void setCentreIds(List<UUID> centreIds) { this.centreIds = centreIds; }
    public boolean isSaisieNotesBloqueeCentre() { return saisieNotesBloqueeCentre; }
    public void setSaisieNotesBloqueeCentre(boolean saisieNotesBloqueeCentre) { this.saisieNotesBloqueeCentre = saisieNotesBloqueeCentre; }
    public List<EpreuveConcoursBlanc> getEpreuves() { return epreuves; }
    public void setEpreuves(List<EpreuveConcoursBlanc> epreuves) { this.epreuves = epreuves; }
}

