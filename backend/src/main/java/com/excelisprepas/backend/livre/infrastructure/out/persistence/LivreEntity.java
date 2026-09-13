package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "livres")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LivreEntity {

    @Id
    private UUID id;

    @Column(nullable = false, unique = true)
    private String titre;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal prix;

    @Column(nullable = false)
    private boolean actif;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}

