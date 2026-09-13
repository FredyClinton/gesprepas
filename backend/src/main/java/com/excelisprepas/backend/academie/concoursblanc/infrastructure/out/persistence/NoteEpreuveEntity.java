package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.StatutNote;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "notes_epreuves_candidat")
public class NoteEpreuveEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resultat_candidat_id", nullable = false)
    private ResultatCandidatEntity resultatCandidat;

    @Column(name = "epreuve_id", nullable = false)
    private UUID epreuveId;

    @Column(precision = 5, scale = 2)
    private BigDecimal note;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutNote statut;

    public NoteEpreuveEntity() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ResultatCandidatEntity getResultatCandidat() { return resultatCandidat; }
    public void setResultatCandidat(ResultatCandidatEntity resultatCandidat) { this.resultatCandidat = resultatCandidat; }
    public UUID getEpreuveId() { return epreuveId; }
    public void setEpreuveId(UUID epreuveId) { this.epreuveId = epreuveId; }
    public BigDecimal getNote() { return note; }
    public void setNote(BigDecimal note) { this.note = note; }
    public StatutNote getStatut() { return statut; }
    public void setStatut(StatutNote statut) { this.statut = statut; }
}

