package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

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
public class PersonnelEntity {

    @Id
    private UUID id;

    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String prenom;

    @Column(name = "telephone")
    private String telephone;

    @Column(name = "numero_cni")
    private String numeroCni;

    @Column(name = "email", unique = true)
    private String email;
}
