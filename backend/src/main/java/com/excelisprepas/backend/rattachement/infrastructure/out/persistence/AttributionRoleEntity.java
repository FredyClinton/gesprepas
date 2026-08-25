package com.excelisprepas.backend.rattachement.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "attributions_role",
        uniqueConstraints = @UniqueConstraint(columnNames = {"utilisateur_id", "session_id", "role"}))
@Getter
@Setter
@NoArgsConstructor
public class AttributionRoleEntity {

    @Id
    private UUID id;

    @Column(name = "utilisateur_id", nullable = false)
    private UUID utilisateurId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleUtilisateur role;
}