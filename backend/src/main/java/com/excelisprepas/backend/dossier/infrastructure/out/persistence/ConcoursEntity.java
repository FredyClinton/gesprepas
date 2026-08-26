package com.excelisprepas.backend.dossier.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "concours")
@Getter
@Setter
@NoArgsConstructor
public class ConcoursEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "date_limite_depot", nullable = false)
    private LocalDate dateLimiteDepot;

    @Column(name = "date_limite_recevabilite_centre", nullable = false)
    private LocalDate dateLimiteRecevabiliteCentre;
}