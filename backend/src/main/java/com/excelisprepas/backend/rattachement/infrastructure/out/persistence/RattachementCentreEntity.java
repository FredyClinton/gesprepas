package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "rattachements_centre",
        uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "session_id"}))
@Getter
@Setter
@NoArgsConstructor
public class RattachementCentreEntity {

    @Id
    private UUID id;

    @Column(name = "utilisateur_id", nullable = false)
    private UUID utilisateurId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId;
}