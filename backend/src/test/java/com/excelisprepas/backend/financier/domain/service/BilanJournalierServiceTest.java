package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.*;
import com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BilanJournalierServiceTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID motifId = UUID.randomUUID();
    private final UUID saisiParUtilisateurId = UUID.randomUUID();
    private final UUID validateurChefCentreId = UUID.randomUUID();
    private final UUID validateurControleurId = UUID.randomUUID();
    private final LocalDate date = LocalDate.of(2026, 9, 15);

    private BilanJournalierRepositoryPort bilanRepository;
    private EntreeRepositoryPort entreeRepository;
    private SortieRepositoryPort sortieRepository;
    private ApprenantRepositoryPort apprenantRepository;
    private CentreRepositoryPort centreRepository;
    private UtilisateurRepositoryPort utilisateurRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private BilanJournalierService service;

    @BeforeEach
    void setUp() {
        bilanRepository = mock(BilanJournalierRepositoryPort.class);
        entreeRepository = mock(EntreeRepositoryPort.class);
        sortieRepository = mock(SortieRepositoryPort.class);
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        service = new BilanJournalierService(bilanRepository, entreeRepository, sortieRepository,
                apprenantRepository, centreRepository, utilisateurRepository, sessionRepository);
    }

    private SessionAcademique uneSessionEnCours() {
        return SessionAcademique.reconstituer(sessionId, "2026-2027",
                LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS);
    }

    private Utilisateur unUtilisateur(UUID id) {
        return new Utilisateur(id, "Nom", "Prenom", id + "@excelis.cm", "hash", RoleUtilisateur.COMPTABLE);
    }

    private Entree uneEntreeValidee(BigDecimal montant, UUID formationId) {
        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, montant, date,
                saisiParUtilisateurId, centreId, null, formationId);
        entree.appliquerDecision(StatutMouvement.VALIDE);
        return entree;
    }

    private Sortie uneSortieValidee(BigDecimal montant) {
        Sortie sortie = new Sortie(UUID.randomUUID(), sessionId, motifId, montant, date,
                saisiParUtilisateurId, centreId, "Ordonnateur");
        sortie.appliquerDecision(StatutMouvement.VALIDE);
        return sortie;
    }

    @Nested
    @DisplayName("Validation Chef de centre (1ère signature)")
    class ValidationChefCentre {

        @Test
        @DisplayName("crée un bilan EN_ATTENTE_CONTROLEUR")
        void creeUnBilanEnAttenteControleur() {
            // Given
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre NIL", "Adresse", "Yaoundé")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(utilisateurRepository.findById(validateurChefCentreId)).thenReturn(Optional.of(unUtilisateur(validateurChefCentreId)));
            when(bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date)).thenReturn(Optional.empty());
            when(bilanRepository.save(any(BilanJournalier.class))).thenAnswer(i -> i.getArgument(0));

            // When
            BilanJournalier resultat = service.validerBilanChefCentre(centreId, sessionId, date, validateurChefCentreId);

            // Then
            assertThat(resultat.getStatut()).isEqualTo(StatutBilan.EN_ATTENTE_CONTROLEUR);
            assertThat(resultat.getValidateurChefCentreId()).isEqualTo(validateurChefCentreId);
            assertThat(resultat.getTotalEntrees()).isNull();
        }

        @Test
        @DisplayName("refuse si le centre n'existe pas")
        void refuseSiCentreInexistant() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.validerBilanChefCentre(centreId, sessionId, date, validateurChefCentreId);

            assertThatThrownBy(action).isInstanceOf(CentreIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la session est clôturée")
        void refuseSiSessionCloturee() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre NIL", "Adresse", "Yaoundé")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable action = () -> service.validerBilanChefCentre(centreId, sessionId, date, validateurChefCentreId);

            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
        }

        @Test
        @DisplayName("refuse si le validateur n'existe pas")
        void refuseSiValidateurInexistant() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre NIL", "Adresse", "Yaoundé")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(utilisateurRepository.findById(validateurChefCentreId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.validerBilanChefCentre(centreId, sessionId, date, validateurChefCentreId);

            assertThatThrownBy(action).isInstanceOf(UtilisateurIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si un bilan existe déjà pour ce centre/session/date")
        void refuseSiBilanDejaExistant() {
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre NIL", "Adresse", "Yaoundé")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(utilisateurRepository.findById(validateurChefCentreId)).thenReturn(Optional.of(unUtilisateur(validateurChefCentreId)));
            when(bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date)).thenReturn(Optional.of(
                    new BilanJournalier(UUID.randomUUID(), centreId, sessionId, date, java.time.LocalDateTime.now(), validateurChefCentreId)));

            ThrowingCallable action = () -> service.validerBilanChefCentre(centreId, sessionId, date, validateurChefCentreId);

            assertThatThrownBy(action).isInstanceOf(BilanJournalierDejaExistantException.class);
            verify(bilanRepository, never()).save(any(BilanJournalier.class));
        }
    }

    @Nested
    @DisplayName("Validation Contrôleur (2ème signature, clôture)")
    class ValidationControleur {

        @Test
        @DisplayName("calcule les totaux, clôture le bilan et rattache les mouvements Valide du jour")
        void validationControleurClotureEtRattache() {
            // Given
            BilanJournalier bilan = new BilanJournalier(
                    UUID.randomUUID(), centreId, sessionId, date, java.time.LocalDateTime.now(), validateurChefCentreId);
            UUID formationId = UUID.randomUUID();
            Entree entree1 = uneEntreeValidee(new BigDecimal("1000000"), formationId);
            Entree entree2 = uneEntreeValidee(new BigDecimal("300000"), null);
            Sortie sortie1 = uneSortieValidee(new BigDecimal("500000"));

            when(bilanRepository.findById(bilan.getId())).thenReturn(Optional.of(bilan));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(utilisateurRepository.findById(validateurControleurId)).thenReturn(Optional.of(unUtilisateur(validateurControleurId)));
            when(entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.VALIDE))
                    .thenReturn(List.of(entree1, entree2));
            when(sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.VALIDE))
                    .thenReturn(List.of(sortie1));
            when(apprenantRepository.countByCentreIdAndSessionIdAndDateInscription(centreId, sessionId, date)).thenReturn(3L);
            when(apprenantRepository.countByCentreIdAndSessionId(centreId, sessionId)).thenReturn(620L);
            when(bilanRepository.save(any(BilanJournalier.class))).thenAnswer(i -> i.getArgument(0));
            when(entreeRepository.save(any(Entree.class))).thenAnswer(i -> i.getArgument(0));
            when(sortieRepository.save(any(Sortie.class))).thenAnswer(i -> i.getArgument(0));

            // When
            BilanJournalier resultat = service.validerBilanControleur(bilan.getId(), validateurControleurId);

            // Then
            assertThat(resultat.getStatut()).isEqualTo(StatutBilan.CLOTURE);
            assertThat(resultat.getTotalEntrees()).isEqualByComparingTo("1300000");
            assertThat(resultat.getTotalSorties()).isEqualByComparingTo("500000");
            assertThat(resultat.getNetAVerser()).isEqualByComparingTo("800000");
            assertThat(resultat.getEffectifNouveauxEleves()).isEqualTo(3);
            assertThat(resultat.getEffectifTotalCentre()).isEqualTo(620);
            assertThat(entree1.getBilanJournalierId()).contains(bilan.getId());
            assertThat(entree2.getBilanJournalierId()).contains(bilan.getId());
            assertThat(sortie1.getBilanJournalierId()).contains(bilan.getId());
        }

        @Test
        @DisplayName("refuse si le bilan n'existe pas")
        void refuseSiBilanIntrouvable() {
            UUID bilanId = UUID.randomUUID();
            when(bilanRepository.findById(bilanId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.validerBilanControleur(bilanId, validateurControleurId);

            assertThatThrownBy(action).isInstanceOf(BilanJournalierIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si le bilan est déjà clôturé")
        void refuseSiDejaCloture() {
            BilanJournalier bilan = new BilanJournalier(
                    UUID.randomUUID(), centreId, sessionId, date, java.time.LocalDateTime.now(), validateurChefCentreId);
            bilan.cloturer(UUID.randomUUID(), java.time.LocalDateTime.now(),
                    new BigDecimal("1000000"), new BigDecimal("500000"), 2, 600);

            when(bilanRepository.findById(bilan.getId())).thenReturn(Optional.of(bilan));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(utilisateurRepository.findById(validateurControleurId)).thenReturn(Optional.of(unUtilisateur(validateurControleurId)));

            ThrowingCallable action = () -> service.validerBilanControleur(bilan.getId(), validateurControleurId);

            assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("refuse si la session est clôturée")
        void refuseSiSessionCloturee() {
            BilanJournalier bilan = new BilanJournalier(
                    UUID.randomUUID(), centreId, sessionId, date, java.time.LocalDateTime.now(), validateurChefCentreId);
            when(bilanRepository.findById(bilan.getId())).thenReturn(Optional.of(bilan));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable action = () -> service.validerBilanControleur(bilan.getId(), validateurControleurId);

            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
        }
    }

    @Nested
    @DisplayName("Consultation du bilan du jour")
    class ConsultationBilanDuJour {

        @Test
        @DisplayName("retourne les valeurs figées si un bilan CLOTURE existe déjà")
        void retourneLesValeursFigeesSiCloture() {
            // Given
            BilanJournalier bilan = new BilanJournalier(
                    UUID.randomUUID(), centreId, sessionId, date, java.time.LocalDateTime.now(), validateurChefCentreId);
            bilan.cloturer(validateurControleurId, java.time.LocalDateTime.now(),
                    new BigDecimal("1300000"), new BigDecimal("500000"), 3, 620);
            when(bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date)).thenReturn(Optional.of(bilan));

            // When
            BilanJournalierApercu apercu = service.consulterBilanDuJour(centreId, sessionId, date);

            // Then
            assertThat(apercu.statut()).isEqualTo(StatutBilan.CLOTURE);
            assertThat(apercu.totalEntrees()).isEqualByComparingTo("1300000");
            verify(entreeRepository, never()).findByCentreIdAndSessionIdAndDateAndStatut(any(), any(), any(), any());
        }

        @Test
        @DisplayName("calcule à la volée si aucun bilan n'existe encore")
        void calculeALaVoleeSiAucunBilan() {
            // Given
            when(bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date)).thenReturn(Optional.empty());
            when(entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.VALIDE))
                    .thenReturn(List.of(uneEntreeValidee(new BigDecimal("300000"), null)));
            when(sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.VALIDE))
                    .thenReturn(List.of());
            when(apprenantRepository.countByCentreIdAndSessionIdAndDateInscription(centreId, sessionId, date)).thenReturn(1L);
            when(apprenantRepository.countByCentreIdAndSessionId(centreId, sessionId)).thenReturn(450L);

            // When
            BilanJournalierApercu apercu = service.consulterBilanDuJour(centreId, sessionId, date);

            // Then
            assertThat(apercu.id()).isNull();
            assertThat(apercu.statut()).isNull();
            assertThat(apercu.totalEntrees()).isEqualByComparingTo("300000");
            assertThat(apercu.effectifTotalCentre()).isEqualTo(450);
        }

        @Test
        @DisplayName("calcule à la volée en gardant id/statut si un bilan EN_ATTENTE_CONTROLEUR existe")
        void calculeALaVoleeEnGardantIdEtStatutSiEnAttente() {
            // Given
            BilanJournalier bilan = new BilanJournalier(
                    UUID.randomUUID(), centreId, sessionId, date, java.time.LocalDateTime.now(), validateurChefCentreId);
            when(bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date)).thenReturn(Optional.of(bilan));
            when(entreeRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.VALIDE))
                    .thenReturn(List.of());
            when(sortieRepository.findByCentreIdAndSessionIdAndDateAndStatut(centreId, sessionId, date, StatutMouvement.VALIDE))
                    .thenReturn(List.of());
            when(apprenantRepository.countByCentreIdAndSessionIdAndDateInscription(centreId, sessionId, date)).thenReturn(0L);
            when(apprenantRepository.countByCentreIdAndSessionId(centreId, sessionId)).thenReturn(450L);

            // When
            BilanJournalierApercu apercu = service.consulterBilanDuJour(centreId, sessionId, date);

            // Then
            assertThat(apercu.id()).isEqualTo(bilan.getId());
            assertThat(apercu.statut()).isEqualTo(StatutBilan.EN_ATTENTE_CONTROLEUR);
        }
    }

    @Nested
    @DisplayName("Répartition par formation")
    class RepartitionParFormation {

        @Test
        @DisplayName("regroupe les entrées rattachées par formation, y compris celles sans formation")
        void regroupeParFormation() {
            // Given
            UUID bilanId = UUID.randomUUID();
            UUID formationA = UUID.randomUUID();
            UUID formationB = UUID.randomUUID();
            BilanJournalier bilan = new BilanJournalier(
                    bilanId, centreId, sessionId, date, java.time.LocalDateTime.now(), validateurChefCentreId);

            Entree entreeFormationA1 = uneEntreeValidee(new BigDecimal("100000"), formationA);
            Entree entreeFormationA2 = uneEntreeValidee(new BigDecimal("50000"), formationA);
            Entree entreeFormationB = uneEntreeValidee(new BigDecimal("200000"), formationB);
            Entree entreeSansFormation = uneEntreeValidee(new BigDecimal("30000"), null);

            when(bilanRepository.findById(bilanId)).thenReturn(Optional.of(bilan));
            when(entreeRepository.findByBilanJournalierId(bilanId)).thenReturn(
                    List.of(entreeFormationA1, entreeFormationA2, entreeFormationB, entreeSansFormation));

            // When
            List<RepartitionFormationLigne> resultat = service.consulterRepartitionParFormation(bilanId);

            // Then
            assertThat(resultat).hasSize(3);
            assertThat(resultat).anySatisfy(ligne -> {
                if (formationA.equals(ligne.formationId())) {
                    assertThat(ligne.montant()).isEqualByComparingTo("150000");
                }
            });
            assertThat(resultat).anySatisfy(ligne -> {
                if (ligne.formationId() == null) {
                    assertThat(ligne.montant()).isEqualByComparingTo("30000");
                }
            });
        }

        @Test
        @DisplayName("refuse si le bilan n'existe pas")
        void refuseSiBilanIntrouvable() {
            UUID bilanId = UUID.randomUUID();
            when(bilanRepository.findById(bilanId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.consulterRepartitionParFormation(bilanId);

            assertThatThrownBy(action).isInstanceOf(BilanJournalierIntrouvableException.class);
        }
    }
}