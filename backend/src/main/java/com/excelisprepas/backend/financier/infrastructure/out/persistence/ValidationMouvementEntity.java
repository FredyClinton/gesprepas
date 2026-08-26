package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "validations_mouvements")
@Getter
@Setter
@NoArgsConstructor
public class ValidationMouvementEntity {

    @Id
    private UUID id;

    @Column(name = "mouvement_financier_id", nullable = false)
    private UUID mouvementFinancierId;

    @Column(name = "validateur_utilisateur_id", nullable = false)
    private UUID validateurUtilisateurId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutMouvement decision;

    @Column(nullable = false)
    private LocalDateTime date;
}