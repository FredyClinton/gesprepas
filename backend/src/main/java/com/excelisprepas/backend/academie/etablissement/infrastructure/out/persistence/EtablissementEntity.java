package com.excelisprepas.backend.academie.etablissement.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "etablissements")
@Getter
@Setter
@NoArgsConstructor
public class EtablissementEntity {

    @Id
    @Column(name = "id", nullable = false)
    private UUID id;

    @Column(name = "nom", nullable = false, unique = true)
    private String nom;

    @Column(name = "ville")
    private String ville;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public EtablissementEntity(UUID id, String nom, String ville) {
        this.id = id;
        this.nom = nom;
        this.ville = ville;
        this.createdAt = LocalDateTime.now();
    }
}

