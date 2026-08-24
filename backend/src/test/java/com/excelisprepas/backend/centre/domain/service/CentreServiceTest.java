package com.excelisprepas.backend.centre.domain.service;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.exception.CentreUtiliseException;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.model.StatutCentre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
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

class CentreServiceTest {

    private CentreRepositoryPort centreRepository;
    private FormationRepositoryPort formationRepository;
    private ApprenantRepositoryPort apprenantRepository;
    private SalleRepositoryPort salleRepository;
    private AffectationRepositoryPort affectationRepository;
    private UtilisateurRepositoryPort utilisateurRepository;
    private CentreService service;

    @BeforeEach
    void setUp() {
        centreRepository = mock(CentreRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        salleRepository = mock(SalleRepositoryPort.class);
        affectationRepository = mock(AffectationRepositoryPort.class);
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);
        service = new CentreService(centreRepository, formationRepository, apprenantRepository,
                salleRepository, affectationRepository, utilisateurRepository);
    }

    private Centre unCentre() {
        return new Centre(UUID.randomUUID(), "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée un centre et le sauvegarde via le repository")
        void creeUnCentreEtLeSauvegarde() {
            // Given
            when(centreRepository.save(any(Centre.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Centre resultat = service.creerCentre("Centre Yaoundé", "Avenue Kennedy", "Yaoundé");

            // Then
            assertThat(resultat.getNom()).isEqualTo("Centre Yaoundé");
            verify(centreRepository).save(any(Centre.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererCentre() retourne le centre s'il existe")
        void recupererCentreRetourneLeCentre() {
            // Given
            Centre centre = unCentre();
            when(centreRepository.findById(centre.getId())).thenReturn(Optional.of(centre));

            // When
            Centre resultat = service.recupererCentre(centre.getId());

            // Then
            assertThat(resultat).isEqualTo(centre);
        }

        @Test
        @DisplayName("recupererCentre() lève CentreIntrouvableException si absent")
        void recupererCentreInexistantLeveException() {
            // Given
            UUID id = UUID.randomUUID();
            when(centreRepository.findById(id)).thenReturn(Optional.empty());

            // When
            ThrowingCallable recuperation = () -> service.recupererCentre(id);

            // Then
            assertThatThrownBy(recuperation).isInstanceOf(CentreIntrouvableException.class);
        }

        @Test
        @DisplayName("listerCentres() retourne tous les centres")
        void listerCentresRetourneTous() {
            // Given
            List<Centre> centres = List.of(unCentre(), unCentre());
            when(centreRepository.findAll()).thenReturn(centres);

            // When
            List<Centre> resultat = service.listerCentres();

            // Then
            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Cycle de vie")
    class CycleDeVie {

        @Test
        @DisplayName("fermerCentre() ferme le centre et le sauvegarde")
        void fermerCentreFermeEtSauvegarde() {
            // Given
            Centre centre = unCentre();
            when(centreRepository.findById(centre.getId())).thenReturn(Optional.of(centre));
            when(centreRepository.save(any(Centre.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Centre resultat = service.fermerCentre(centre.getId());

            // Then
            assertThat(resultat.getStatut()).isEqualTo(StatutCentre.FERME);
            verify(centreRepository).save(centre);
        }

        @Test
        @DisplayName("rouvrirCentre() rouvre le centre et le sauvegarde")
        void rouvrirCentreRouvreEtSauvegarde() {
            // Given
            Centre centre = unCentre();
            centre.fermer();
            when(centreRepository.findById(centre.getId())).thenReturn(Optional.of(centre));
            when(centreRepository.save(any(Centre.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Centre resultat = service.rouvrirCentre(centre.getId());

            // Then
            assertThat(resultat.getStatut()).isEqualTo(StatutCentre.OUVERT);
        }

        @Test
        @DisplayName("renommerCentre() renomme et sauvegarde")
        void renommerCentreRenommeEtSauvegarde() {
            // Given
            Centre centre = unCentre();
            when(centreRepository.findById(centre.getId())).thenReturn(Optional.of(centre));
            when(centreRepository.save(any(Centre.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Centre resultat = service.renommerCentre(centre.getId(), "Centre Douala");

            // Then
            assertThat(resultat.getNom()).isEqualTo("Centre Douala");
        }

        @Test
        @DisplayName("relocaliserCentre() relocalise et sauvegarde")
        void relocaliserCentreRelocaliseEtSauvegarde() {
            // Given
            Centre centre = unCentre();
            when(centreRepository.findById(centre.getId())).thenReturn(Optional.of(centre));
            when(centreRepository.save(any(Centre.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Centre resultat = service.relocaliserCentre(centre.getId(), "Boulevard du 20 Mai", "Yaoundé");

            // Then
            assertThat(resultat.getLocalisationActuelle().getAdresse()).isEqualTo("Boulevard du 20 Mai");
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerCentre() supprime si aucune référence ailleurs")
        void supprimerCentreSansReferenceSupprime() {
            // Given
            Centre centre = unCentre();
            when(centreRepository.findById(centre.getId())).thenReturn(Optional.of(centre));
            when(formationRepository.existsByCentreId(centre.getId())).thenReturn(false);
            when(apprenantRepository.existsByCentreId(centre.getId())).thenReturn(false);
            when(salleRepository.existsByCentreId(centre.getId())).thenReturn(false);
            when(affectationRepository.existsByCentreId(centre.getId())).thenReturn(false);
            when(utilisateurRepository.existsByCentreId(centre.getId())).thenReturn(false);

            // When
            service.supprimerCentre(centre.getId());

            // Then
            verify(centreRepository).deleteById(centre.getId());
        }

        @Test
        @DisplayName("supprimerCentre() refuse si une Formation référence encore le centre")
        void supprimerCentreAvecFormationRefuse() {
            // Given
            Centre centre = unCentre();
            when(centreRepository.findById(centre.getId())).thenReturn(Optional.of(centre));
            when(formationRepository.existsByCentreId(centre.getId())).thenReturn(true);

            // When
            ThrowingCallable suppression = () -> service.supprimerCentre(centre.getId());

            // Then
            assertThatThrownBy(suppression).isInstanceOf(CentreUtiliseException.class);
            verify(centreRepository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerCentre() refuse si un Utilisateur référence encore le centre")
        void supprimerCentreAvecUtilisateurRefuse() {
            // Given
            Centre centre = unCentre();
            when(centreRepository.findById(centre.getId())).thenReturn(Optional.of(centre));
            when(formationRepository.existsByCentreId(centre.getId())).thenReturn(false);
            when(apprenantRepository.existsByCentreId(centre.getId())).thenReturn(false);
            when(salleRepository.existsByCentreId(centre.getId())).thenReturn(false);
            when(affectationRepository.existsByCentreId(centre.getId())).thenReturn(false);
            when(utilisateurRepository.existsByCentreId(centre.getId())).thenReturn(true);

            // When
            ThrowingCallable suppression = () -> service.supprimerCentre(centre.getId());

            // Then
            assertThatThrownBy(suppression).isInstanceOf(CentreUtiliseException.class);
            verify(centreRepository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerCentre() lève CentreIntrouvableException si le centre n'existe pas")
        void supprimerCentreInexistantLeveException() {
            // Given
            UUID id = UUID.randomUUID();
            when(centreRepository.findById(id)).thenReturn(Optional.empty());

            // When
            ThrowingCallable suppression = () -> service.supprimerCentre(id);

            // Then
            assertThatThrownBy(suppression).isInstanceOf(CentreIntrouvableException.class);
        }
    }
}