package com.excelisprepas.backend.formation.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "formations")
@Getter
@Setter
@NoArgsConstructor
public class FormationEntity {

    @Id
    private UUID id;

    private String nom;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId; // référence brute — pas de @ManyToOne (bounded context séparé)

    @Column(name = "session_id", nullable = false)
    private UUID sessionId; // idem
}
