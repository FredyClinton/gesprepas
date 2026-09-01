package com.excelisprepas.backend.inscription.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "dossiers_inscriptions")
@Getter
@Setter
@NoArgsConstructor
public class DossierInscriptionEntity {

    @Id
    private UUID id;

    @Column(name = "apprenant_id", nullable = false)
    private UUID apprenantId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId;

    @Column(name = "montant_global", nullable = false)
    private BigDecimal montantGlobal;

    @Column(name = "date_inscription", nullable = false)
    private LocalDate dateInscription;

    @Column(name = "pre_inscrit", nullable = false)
    private Boolean preInscrit;

    @Column(name = "reference_recu")
    private String referenceRecu;

    @ElementCollection
    @CollectionTable(name = "dossier_phases", joinColumns = @JoinColumn(name = "dossier_id"))
    @Column(name = "phase_id")
    private List<UUID> phasesSouscrites;

    @ElementCollection
    @CollectionTable(name = "dossier_formations", joinColumns = @JoinColumn(name = "dossier_id"))
    @Column(name = "formation_id")
    private List<UUID> formationsCibles;

    @ElementCollection
    @CollectionTable(name = "dossier_concours", joinColumns = @JoinColumn(name = "dossier_id"))
    @Column(name = "concours_id")
    private List<UUID> concoursCibles;
}

