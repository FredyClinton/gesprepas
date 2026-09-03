package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "fiches_paie_enseignant")
@Getter
@Setter
@NoArgsConstructor
public class FichePaieEnseignantEntity {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bordereau_paie_id", nullable = false)
    private BordereauPaieEntity bordereauPaie;

    @Column(name = "enseignant_id", nullable = false)
    private UUID enseignantId;

    @Column(name = "nombre_seances", nullable = false)
    private int nombreSeances;

    @Column(name = "montant_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal montantTotal;

    // Lignes de decompte seance - on les garde dans l'affectation, on n'a pas besoin de les redoubler en BD
    // sauf si on veut une table separee. Pour l'instant, l'Affectation a deja coutApplique et fichePaieId.
}
