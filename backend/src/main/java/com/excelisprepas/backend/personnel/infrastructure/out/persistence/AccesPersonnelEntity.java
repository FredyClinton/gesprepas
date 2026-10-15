package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.StatutAcces;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "acces_personnel")
@Getter
@Setter
@NoArgsConstructor
public class AccesPersonnelEntity {

    @Id
    private UUID id;

    @Column(name = "personnel_id", nullable = false)
    private UUID personnelId;

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "phase_id")
    private UUID phaseId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutAcces statut;

    @Column(name = "motif")
    private String motif;

    @Column(name = "date_modification", nullable = false)
    private LocalDateTime dateModification;
}
