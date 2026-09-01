package com.excelisprepas.backend.apprenant.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ApprenantServiceTest {

    private final UUID centreId = UUID.randomUUID();

    private ApprenantRepositoryPort apprenantRepository;
    private CentreRepositoryPort centreRepository;
    private ApprenantService service;

    @BeforeEach
    void setUp() {
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        service = new ApprenantService(apprenantRepository, centreRepository);
    }

    private Apprenant unApprenant() {
        return new Apprenant(UUID.randomUUID(), "Mballa", "Sophie",
                LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                centreId, null, null, null);
    }

    private void stubCreationValide() {
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé")));
    }

    @Nested
    @DisplayName("Creation")
    class Creation {

        @Test
        @DisplayName("cree un apprenant quand centre existe")
        void creeApprenantQuandToutEstValide() {
            stubCreationValide();
            when(apprenantRepository.save(any(Apprenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Apprenant resultat = service.creerApprenant("Mballa", "Sophie",
                    LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                    centreId, null, null, null);

            assertThat(resultat.getNom()).isEqualTo("Mballa");
            verify(apprenantRepository).save(any(Apprenant.class));
        }

        @Test
        @DisplayName("refuse la creation si le centre n'existe pas")
        void refuseCreationSiCentreInexistant() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            ThrowingCallable creation = () -> service.creerApprenant("Mballa", "Sophie",
                    LocalDate.of(2005, 3, 12), LocalDate.of(2026, 9, 1),
                    centreId, null, null, null);

            assertThatThrownBy(creation).isInstanceOf(CentreIntrouvableException.class);
            verify(apprenantRepository, never()).save(any(Apprenant.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererApprenant() retourne l'apprenant s'il existe")
        void recupererApprenantRetourneLApprenant() {
            Apprenant apprenant = unApprenant();
            when(apprenantRepository.findById(apprenant.getId())).thenReturn(Optional.of(apprenant));

            Apprenant resultat = service.recupererApprenant(apprenant.getId());

            assertThat(resultat).isEqualTo(apprenant);
        }

        @Test
        @DisplayName("recupererApprenant() lève ApprenantIntrouvableException si absent")
        void recupererApprenantInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(apprenantRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererApprenant(id);

            assertThatThrownBy(recuperation).isInstanceOf(ApprenantIntrouvableException.class);
        }

        @Test
        @DisplayName("listerApprenants() retourne tous les apprenants")
        void listerApprenantsRetourneTous() {
            when(apprenantRepository.findAll()).thenReturn(List.of(unApprenant(), unApprenant()));

            List<Apprenant> resultat = service.listerApprenants();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Transfert")
    class Transfert {

        @Test
        @DisplayName("transfererCentre() change le centre si le nouveau centre existe")
        void transfererCentreReussit() {
            Apprenant apprenant = unApprenant();
            UUID nouveauCentreId = UUID.randomUUID();
            when(apprenantRepository.findById(apprenant.getId())).thenReturn(Optional.of(apprenant));
            when(centreRepository.findById(nouveauCentreId)).thenReturn(Optional.of(
                    new Centre(nouveauCentreId, "Centre Douala", "Adresse", "Douala")));
            when(apprenantRepository.save(any(Apprenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Apprenant resultat = service.transfererCentre(apprenant.getId(), nouveauCentreId);

            assertThat(resultat.getCentreId()).isEqualTo(nouveauCentreId);
        }

        @Test
        @DisplayName("transfererCentre() refuse si le nouveau centre n'existe pas")
        void transfererCentreRefuseSiCentreInexistant() {
            Apprenant apprenant = unApprenant();
            UUID nouveauCentreId = UUID.randomUUID();
            when(apprenantRepository.findById(apprenant.getId())).thenReturn(Optional.of(apprenant));
            when(centreRepository.findById(nouveauCentreId)).thenReturn(Optional.empty());

            ThrowingCallable transfert = () -> service.transfererCentre(apprenant.getId(), nouveauCentreId);

            assertThatThrownBy(transfert).isInstanceOf(CentreIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerApprenant() supprime l'apprenant existant")
        void supprimerApprenantReussit() {
            Apprenant apprenant = unApprenant();
            when(apprenantRepository.findById(apprenant.getId())).thenReturn(Optional.of(apprenant));

            service.supprimerApprenant(apprenant.getId());

            verify(apprenantRepository).deleteById(apprenant.getId());
        }

        @Test
        @DisplayName("supprimerApprenant() lève ApprenantIntrouvableException si absent")
        void supprimerApprenantInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(apprenantRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerApprenant(id);

            assertThatThrownBy(suppression).isInstanceOf(ApprenantIntrouvableException.class);
        }
    }
}
