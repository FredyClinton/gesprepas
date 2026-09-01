package com.excelisprepas.backend.academie.departement.domain.service;

import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.shared.exception.DepartementIntrouvableException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class DepartementServiceTest {

    private DepartementRepositoryPort departementRepository;
    private MatiereRepositoryPort matiereRepository;
    private DepartementService service;

    @BeforeEach
    void setUp() {
        departementRepository = mock(DepartementRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        service = new DepartementService(departementRepository, matiereRepository);
    }

    private Departement unDepartement() {
        return new Departement(UUID.randomUUID(), "Mathématiques", UUID.randomUUID());
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée un département et sa matière associée (relation 1—1)")
        void creeUnDepartementEtSaMatiereAssociee() {
            when(matiereRepository.save(any(Matiere.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(departementRepository.save(any(Departement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Departement resultat = service.creerDepartement("Mathématiques", "Mathématiques");

            assertThat(resultat.getNom()).isEqualTo("Mathématiques");
            assertThat(resultat.getMatiereId()).isNotNull();
            verify(matiereRepository).save(any(Matiere.class));
            verify(departementRepository).save(any(Departement.class));
        }

        @Test
        @DisplayName("refuse la création si le nom du département est vide")
        void refuseCreationSiNomDepartementVide() {
            ThrowingCallable creation = () -> service.creerDepartement("  ", "Mathématiques");

            assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
            verify(departementRepository, never()).save(any(Departement.class));
        }

        @Test
        @DisplayName("refuse la création si le nom de la matière est vide")
        void refuseCreationSiNomMatiereVide() {
            ThrowingCallable creation = () -> service.creerDepartement("Mathématiques", "  ");

            assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
            verify(matiereRepository, never()).save(any(Matiere.class));
            verify(departementRepository, never()).save(any(Departement.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererDepartement() retourne le département s'il existe")
        void recupererDepartementRetourneLeDepartement() {
            Departement departement = unDepartement();
            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));

            Departement resultat = service.recupererDepartement(departement.getId());

            assertThat(resultat).isEqualTo(departement);
        }

        @Test
        @DisplayName("recupererDepartement() lève DepartementIntrouvableException si absent")
        void recupererDepartementInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(departementRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererDepartement(id);

            assertThatThrownBy(recuperation).isInstanceOf(DepartementIntrouvableException.class);
        }

        @Test
        @DisplayName("listerDepartements() retourne tous les départements")
        void listerDepartementsRetourneTous() {
            when(departementRepository.findAll()).thenReturn(List.of(unDepartement(), unDepartement()));

            List<Departement> resultat = service.listerDepartements();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("renommerDepartement() renomme et sauvegarde")
        void renommerDepartementReussit() {
            Departement departement = unDepartement();
            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));
            when(departementRepository.save(any(Departement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Departement resultat = service.renommerDepartement(departement.getId(), "Physique-Chimie");

            assertThat(resultat.getNom()).isEqualTo("Physique-Chimie");
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerDepartement() supprime le département existant")
        void supprimerDepartementReussit() {
            Departement departement = unDepartement();
            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));

            service.supprimerDepartement(departement.getId());

            verify(departementRepository).deleteById(departement.getId());
        }

        @Test
        @DisplayName("supprimerDepartement() lève DepartementIntrouvableException si absent")
        void supprimerDepartementInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(departementRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerDepartement(id);

            assertThatThrownBy(suppression).isInstanceOf(DepartementIntrouvableException.class);
        }
    }
}