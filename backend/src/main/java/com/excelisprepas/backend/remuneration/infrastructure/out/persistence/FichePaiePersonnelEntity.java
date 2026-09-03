package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "fiches_paie_personnel")
@Getter
@Setter
@NoArgsConstructor
public class FichePaiePersonnelEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bordereau_id", nullable = false)
    private BordereauPaiePersonnelEntity bordereauPaiePersonnel;

    @Column(name = "personnel_id", nullable = false)
    private UUID personnelId;

    @Column(name = "salaire_reference", nullable = false, precision = 12, scale = 2)
    private BigDecimal salaireReference;

    @Column(name = "montant_paye", nullable = false, precision = 12, scale = 2)
    private BigDecimal montantPaye;

    @Column(name = "observations")
    private String observations;
}
