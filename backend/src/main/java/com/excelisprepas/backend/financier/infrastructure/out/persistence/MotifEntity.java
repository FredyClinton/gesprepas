// financier/infrastructure/out/persistence/MotifEntity.java
package com.excelisprepas.backend.financier.infrastructure.out.persistence;

import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "motifs")
@Getter
@Setter
@NoArgsConstructor
public class MotifEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TypeMotif type;

    @Column(nullable = false)
    private boolean actif;
}