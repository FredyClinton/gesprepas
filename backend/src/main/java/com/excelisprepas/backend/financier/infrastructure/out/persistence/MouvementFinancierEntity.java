// financier/infrastructure/out/persistence/MouvementFinancierEntity.java
package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "mouvements_financiers")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "type_mouvement")
@Getter
@Setter
@NoArgsConstructor
public abstract class MouvementFinancierEntity {

    @Id
    private UUID id;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "motif_id", nullable = false)
    private UUID motifId;

    @Column(nullable = false)
    private BigDecimal montant;

    @Column(nullable = false)
    private LocalDate date;

    @Column(name = "saisi_par_utilisateur_id", nullable = false)
    private UUID saisiParUtilisateurId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutMouvement statut;

    @Column(name = "bilan_journalier_id")
    private UUID bilanJournalierId;
}