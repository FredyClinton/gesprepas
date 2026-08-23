package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.ModeCalculPaie;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "personnel")
@Inheritance(strategy = InheritanceType.JOINED)
@Getter
@Setter
@NoArgsConstructor
public abstract  class PersonnelEntity {

    @Id
    private UUID id;

    private  String nom;
    private  String prenom;
    @Enumerated(EnumType.STRING)
    private ModeCalculPaie modeCalculPaie;
}
