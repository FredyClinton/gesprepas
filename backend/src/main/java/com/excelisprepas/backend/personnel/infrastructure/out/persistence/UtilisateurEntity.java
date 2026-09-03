package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "utilisateurs")
@Getter
@Setter
@NoArgsConstructor
public class UtilisateurEntity extends PersonnelEntity {

    @Column(name = "mot_de_passe_hash", nullable = false)
    private String motDePasseHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RoleUtilisateur role;

    @Column(name = "centre_id")
    private UUID centreId; // nullable : rattachement optionnel
}
