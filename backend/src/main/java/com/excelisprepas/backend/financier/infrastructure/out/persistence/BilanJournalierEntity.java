package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.StatutBilan;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "bilans_journaliers", uniqueConstraints = @UniqueConstraint(columnNames = {"centre_id", "session_id", "date"}))
@Getter
@Setter
@NoArgsConstructor
public class BilanJournalierEntity {

    @Id
    private UUID id;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(nullable = false)
    private LocalDate date;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutBilan statut;

    @Column(name = "date_validation_chef_centre", nullable = false)
    private LocalDateTime dateValidationChefCentre;

    @Column(name = "validateur_chef_centre_id", nullable = false)
    private UUID validateurChefCentreId;

    @Column(name = "date_validation_controleur")
    private LocalDateTime dateValidationControleur;

    @Column(name = "validateur_controleur_id")
    private UUID validateurControleurId;

    private BigDecimal totalEntrees;

    private BigDecimal totalSorties;

    @Column(name = "net_a_verser")
    private BigDecimal netAVerser;

    @Column(name = "effectif_nouveaux_eleves")
    private Integer effectifNouveauxEleves;

    @Column(name = "effectif_total_centre")
    private Integer effectifTotalCentre;
}