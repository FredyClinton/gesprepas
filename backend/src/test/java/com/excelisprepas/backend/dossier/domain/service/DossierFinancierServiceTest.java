package com.excelisprepas.backend.dossier.domain.service;

import com.excelisprepas.backend.dossier.domain.model.*;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.DossierConcoursRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.DossierRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.shared.exception.ConcoursIntrouvableException;
import com.excelisprepas.backend.shared.exception.DossierConcoursIntrouvableException;
import com.excelisprepas.backend.shared.exception.DossierIntrouvableException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

class DossierFinancierServiceTest {

    private final UUID dossierConcoursId = UUID.randomUUID();
    private final UUID dossierId = UUID.randomUUID();
    private final UUID apprenantId = UUID.randomUUID();
    private final UUID concoursId = UUID.randomUUID();
    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID motifId = UUID.randomUUID();
    private final UUID utilisateurId = UUID.randomUUID();

    private DossierConcoursRepositoryPort dossierConcoursRepository;
    private DossierRepositoryPort dossierRepository;
    private ConcoursRepositoryPort concoursRepository;
    private SaisirEntreeUseCase saisirEntreeUseCase;
    private EntreeRepositoryPort entreeRepository;
    private DossierFinancierService service;

    @BeforeEach
    void setUp() {
        dossierConcoursRepository = mock(DossierConcoursRepositoryPort.class);
        dossierRepository = mock(DossierRepositoryPort.class);
        concoursRepository = mock(ConcoursRepositoryPort.class);
        saisirEntreeUseCase = mock(SaisirEntreeUseCase.class);
        entreeRepository = mock(EntreeRepositoryPort.class);
        service = new DossierFinancierService(dossierConcoursRepository, dossierRepository, concoursRepository,
                saisirEntreeUseCase, entreeRepository);
    }

    private DossierConcours unDossierConcours() {
        DossierConcours dossierConcours = new DossierConcours(dossierConcoursId, dossierId, concoursId,
                centreId, sessionId, LocalDate.of(2027, 1, 15));
        dossierConcours.redefinirMontantTotal(new BigDecimal("1000"));
        return dossierConcours;
    }

    private Dossier unDossier() {
        return new Dossier(dossierId, apprenantId, centreId, sessionId, LocalDate.of(2027, 1, 10));
    }

    @Nested
    @DisplayName("Enregistrer un paiement")
    class EnregistrerPaiement {

        @Test
        @DisplayName("délègue à SaisirEntreeUseCase avec le bon dossierConcoursId")
        void enregistrerPaiementDelegueAvecLeBonDossierConcoursId() {
            // Given
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.of(unDossierConcours()));
            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(unDossier()));
            Entree entreeAttendue = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("500"),
                    LocalDate.of(2027, 1, 20), utilisateurId, centreId, apprenantId, null, dossierConcoursId);
            when(saisirEntreeUseCase.saisirEntree(sessionId, motifId, new BigDecimal("500"),
                    LocalDate.of(2027, 1, 20), utilisateurId, centreId, apprenantId, dossierConcoursId))
                    .thenReturn(entreeAttendue);

            // When
            Entree resultat = service.enregistrerPaiementDossier(dossierConcoursId, motifId, new BigDecimal("500"),
                    LocalDate.of(2027, 1, 20), utilisateurId);

            // Then
            assertThat(resultat).isEqualTo(entreeAttendue);
            verify(saisirEntreeUseCase).saisirEntree(sessionId, motifId, new BigDecimal("500"),
                    LocalDate.of(2027, 1, 20), utilisateurId, centreId, apprenantId, dossierConcoursId);
        }

        @Test
        @DisplayName("refuse si le DossierConcours n'existe pas")
        void refuseSiDossierConcoursIntrouvable() {
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.enregistrerPaiementDossier(
                    dossierConcoursId, motifId, new BigDecimal("500"), LocalDate.of(2027, 1, 20), utilisateurId);

            assertThatThrownBy(action).isInstanceOf(DossierConcoursIntrouvableException.class);
            verifyNoInteractions(saisirEntreeUseCase);
        }

        @Test
        @DisplayName("refuse si le dossier n'existe pas")
        void refuseSiDossierIntrouvable() {
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.of(unDossierConcours()));
            when(dossierRepository.findById(dossierId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.enregistrerPaiementDossier(
                    dossierConcoursId, motifId, new BigDecimal("500"), LocalDate.of(2027, 1, 20), utilisateurId);

            assertThatThrownBy(action).isInstanceOf(DossierIntrouvableException.class);
            verifyNoInteractions(saisirEntreeUseCase);
        }
    }

    @Nested
    @DisplayName("Consulter le solde")
    class ConsulterSolde {

        @Test
        @DisplayName("calcule montantPaye et soldeRestant à partir des Entree liées")
        void consulterSoldeCalculeCorrectement() {
            // Given
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.of(unDossierConcours()));
            Entree paiement1 = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("300"),
                    LocalDate.of(2027, 1, 20), utilisateurId, centreId, apprenantId, null, dossierConcoursId);
            Entree paiement2 = new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("200"),
                    LocalDate.of(2027, 1, 25), utilisateurId, centreId, apprenantId, null, dossierConcoursId);
            when(entreeRepository.findByDossierConcoursId(dossierConcoursId)).thenReturn(List.of(paiement1, paiement2));

            // When
            SoldeDossierConcours resultat = service.consulterSolde(dossierConcoursId);

            // Then
            assertThat(resultat.dossierConcoursId()).isEqualTo(dossierConcoursId);
            assertThat(resultat.montantTotal()).isEqualByComparingTo("1000");
            assertThat(resultat.montantPaye()).isEqualByComparingTo("500"); // 300 + 200
            assertThat(resultat.soldeRestant()).isEqualByComparingTo("500"); // 1000 - 500
        }

        @Test
        @DisplayName("solde restant égal au total si aucun paiement")
        void soldeRestantEgalAuTotalSiAucunPaiement() {
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.of(unDossierConcours()));
            when(entreeRepository.findByDossierConcoursId(dossierConcoursId)).thenReturn(List.of());

            SoldeDossierConcours resultat = service.consulterSolde(dossierConcoursId);

            assertThat(resultat.montantPaye()).isEqualByComparingTo("0");
            assertThat(resultat.soldeRestant()).isEqualByComparingTo("1000");
        }

        @Test
        @DisplayName("refuse si le DossierConcours n'existe pas")
        void refuseSiDossierConcoursIntrouvable() {
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.consulterSolde(dossierConcoursId);

            assertThatThrownBy(action).isInstanceOf(DossierConcoursIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Obtenir les statistiques")
    class ObtenirStatistiques {

        @Test
        @DisplayName("regroupe le nombre de dossiers par centre")
        void regroupeParCentre() {
            // Given
            UUID centreA = UUID.randomUUID();
            UUID centreB = UUID.randomUUID();
            Concours concours = new Concours(concoursId, "ENSPY", sessionId,
                    LocalDate.of(2027, 6, 30), LocalDate.of(2027, 6, 15));

            DossierConcours dc1 = new DossierConcours(UUID.randomUUID(), UUID.randomUUID(), concoursId, centreA, sessionId, LocalDate.now());
            DossierConcours dc2 = new DossierConcours(UUID.randomUUID(), UUID.randomUUID(), concoursId, centreA, sessionId, LocalDate.now());
            DossierConcours dc3 = new DossierConcours(UUID.randomUUID(), UUID.randomUUID(), concoursId, centreB, sessionId, LocalDate.now());

            when(concoursRepository.findById(concoursId)).thenReturn(Optional.of(concours));
            when(dossierConcoursRepository.findByConcoursIdAndSessionId(concoursId, sessionId))
                    .thenReturn(List.of(dc1, dc2, dc3));

            // When
            List<StatistiqueDossierParCentre> resultat = service.obtenirStatistiques(concoursId, sessionId);

            // Then
            assertThat(resultat).hasSize(2);
            assertThat(resultat).anySatisfy(stat -> {
                if (stat.centreId().equals(centreA)) {
                    assertThat(stat.nombreDossiers()).isEqualTo(2);
                }
            });
            assertThat(resultat).anySatisfy(stat -> {
                if (stat.centreId().equals(centreB)) {
                    assertThat(stat.nombreDossiers()).isEqualTo(1);
                }
            });
        }

        @Test
        @DisplayName("retourne une liste vide si aucun dossier pour ce concours/session")
        void retourneListeVideSiAucunDossier() {
            Concours concours = new Concours(concoursId, "ENSPY", sessionId,
                    LocalDate.of(2027, 6, 30), LocalDate.of(2027, 6, 15));
            when(concoursRepository.findById(concoursId)).thenReturn(Optional.of(concours));
            when(dossierConcoursRepository.findByConcoursIdAndSessionId(concoursId, sessionId)).thenReturn(List.of());

            List<StatistiqueDossierParCentre> resultat = service.obtenirStatistiques(concoursId, sessionId);

            assertThat(resultat).isEmpty();
        }

        @Test
        @DisplayName("refuse si le concours n'existe pas")
        void refuseSiConcoursIntrouvable() {
            when(concoursRepository.findById(concoursId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.obtenirStatistiques(concoursId, sessionId);

            assertThatThrownBy(action).isInstanceOf(ConcoursIntrouvableException.class);
        }
    }
}