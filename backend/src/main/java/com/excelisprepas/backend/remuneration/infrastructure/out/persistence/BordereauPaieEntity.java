package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "bordereaux_paie")
@Getter
@Setter
@NoArgsConstructor
public class BordereauPaieEntity {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "reference", nullable = false, unique = true)
    private String reference;

    @Column(name = "date_paiement", nullable = false)
    private LocalDate datePaiement;

    @Column(name = "nombre_total_enseignants", nullable = false)
    private int nombreTotalEnseignants;

    @Column(name = "nombre_total_seances", nullable = false)
    private int nombreTotalSeances;

    @Column(name = "montant_total_global", nullable = false, precision = 12, scale = 2)
    private BigDecimal montantTotalGlobal;

    @Column(name = "sortie_id", nullable = false)
    private UUID sortieId;

    @Column(name = "saisi_par", nullable = false)
    private String saisiPar;

    @OneToMany(mappedBy = "bordereauPaie", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FichePaieEnseignantEntity> fiches;
}
