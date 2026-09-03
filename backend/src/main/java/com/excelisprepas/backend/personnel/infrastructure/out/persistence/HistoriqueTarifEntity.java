package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "historique_tarifs_enseignant")
@Getter
@Setter
@NoArgsConstructor
public class HistoriqueTarifEntity {

    @Id
    private UUID id;

    @Column(name = "enseignant_id", nullable = false)
    private UUID enseignantId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "semaine_debut", nullable = false)
    private int semaineDebut;

    @Column(name = "semaine_fin", nullable = false)
    private int semaineFin;

    @Column(name = "cout_par_seance", nullable = false, precision = 12, scale = 2)
    private BigDecimal coutParSeance;

    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;
}
