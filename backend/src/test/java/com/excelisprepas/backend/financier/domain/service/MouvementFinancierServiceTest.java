package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class MouvementFinancierServiceTest {

    private final UUID sessionId = UUID.randomUUID();
    private final UUID centreId = UUID.randomUUID();
    private final UUID saisiParUtilisateurId = UUID.randomUUID();
    private final LocalDate date = LocalDate.of(2026, 9, 15);

    private EntreeRepositoryPort entreeRepository;
    private SortieRepositoryPort sortieRepository;
    private MotifRepositoryPort motifRepository;
    private CentreRepositoryPort centreRepository;
    private ApprenantRepositoryPort apprenantRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private MouvementFinancierService service;

    @BeforeEach
    void setUp() {
        entreeRepository = mock(EntreeRepositoryPort.class);
        sortieRepository = mock(SortieRepositoryPort.class);
        motifRepository = mock(MotifRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        service = new MouvementFinancierService(entreeRepository, sortieRepository, motifRepository,
                centreRepository, apprenantRepository, sessionRepository);
    }

    private Motif unMotifEntree() {
        return new Motif(UUID.randomUUID(), "Frais de cours", TypeMotif.ENTREE);
    }

    private Motif unMotifSortie() {
        return new Motif(UUID.randomUUID(), "Location salle", TypeMotif.SORTIE);
    }

    private SessionAcademique uneSessionEnCours() {
        return SessionAcademique.reconstituer(sessionId, "2026-2027",
                LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS);
    }

    @Nested
    @DisplayName("Saisie d'une Entree")
    class SaisieEntree {

        @Test
        @DisplayName("saisit une entree quand tout est valide, sans apprenant")
        void saisitEntreeSansApprenant() {
            // Given
            Motif motif = unMotifEntree();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre NIL", "Adresse", "Yaoundé")));
            when(entreeRepository.save(any(Entree.class))).thenAnswer(i -> i.getArgument(0));

            // When
            Entree resultat = service.saisirEntree(sessionId, motif.getId(), new BigDecimal("300000"), date,
                    saisiParUtilisateurId, centreId, null);

            // Then
            assertThat(resultat.getMontant()).isEqualByComparingTo("300000");
            assertThat(resultat.getApprenantId()).isEmpty();
            assertThat(resultat.getFormationId()).isEmpty();
        }

        @Test
        @DisplayName("saisit une entree avec apprenant, dérive formationId automatiquement")
        void saisitEntreeAvecApprenantDeriveFormationId() {
            // Given
            Motif motif = unMotifEntree();
            UUID apprenantId = UUID.randomUUID();
            UUID formationId = UUID.randomUUID();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre NIL", "Adresse", "Yaoundé")));
            when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.of(
                    new Apprenant(apprenantId, "Essomba", "Paul", LocalDate.of(2005, 1, 1), date,
                            new BigDecimal("50000"), date, centreId, sessionId, formationId)));
            when(entreeRepository.save(any(Entree.class))).thenAnswer(i -> i.getArgument(0));

            // When
            Entree resultat = service.saisirEntree(sessionId, motif.getId(), new BigDecimal("15000"), date,
                    saisiParUtilisateurId, centreId, apprenantId);

            // Then
            assertThat(resultat.getApprenantId()).contains(apprenantId);
            assertThat(resultat.getFormationId()).contains(formationId);
        }

        @Test
        @DisplayName("refuse si le motif n'existe pas")
        void refuseSiMotifInexistant() {
            UUID motifId = UUID.randomUUID();
            when(motifRepository.findById(motifId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.saisirEntree(sessionId, motifId, new BigDecimal("10000"), date,
                    saisiParUtilisateurId, centreId, null);

            assertThatThrownBy(action).isInstanceOf(MotifIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si le motif est inactif")
        void refuseSiMotifInactif() {
            Motif motif = unMotifEntree();
            motif.desactiver();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));

            ThrowingCallable action = () -> service.saisirEntree(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, null);

            assertThatThrownBy(action).isInstanceOf(MotifInactifException.class);
        }

        @Test
        @DisplayName("refuse si le motif est de type SORTIE")
        void refuseSiMotifTypeIncorrect() {
            Motif motif = unMotifSortie();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));

            ThrowingCallable action = () -> service.saisirEntree(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, null);

            assertThatThrownBy(action).isInstanceOf(MotifTypeIncorrectException.class);
        }

        @Test
        @DisplayName("refuse si la session est clôturée")
        void refuseSiSessionCloturee() {
            Motif motif = unMotifEntree();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable action = () -> service.saisirEntree(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, null);

            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
        }

        @Test
        @DisplayName("refuse si le centre n'existe pas")
        void refuseSiCentreInexistant() {
            Motif motif = unMotifEntree();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.saisirEntree(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, null);

            assertThatThrownBy(action).isInstanceOf(CentreIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si l'apprenant n'existe pas")
        void refuseSiApprenantInexistant() {
            Motif motif = unMotifEntree();
            UUID apprenantId = UUID.randomUUID();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre NIL", "Adresse", "Yaoundé")));
            when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.saisirEntree(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, apprenantId);

            assertThatThrownBy(action).isInstanceOf(ApprenantIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Saisie d'une Sortie")
    class SaisieSortie {

        @Test
        @DisplayName("saisit une sortie avec centre")
        void saisitSortieAvecCentre() {
            Motif motif = unMotifSortie();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre NIL", "Adresse", "Yaoundé")));
            when(sortieRepository.save(any(Sortie.class))).thenAnswer(i -> i.getArgument(0));

            Sortie resultat = service.saisirSortie(sessionId, motif.getId(), new BigDecimal("200000"), date,
                    saisiParUtilisateurId, centreId, "Jean Directeur");

            assertThat(resultat.getCentreId()).contains(centreId);
        }

        @Test
        @DisplayName("saisit une sortie sans centre (dépense organisationnelle)")
        void saisitSortieSansCentre() {
            Motif motif = unMotifSortie();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(sortieRepository.save(any(Sortie.class))).thenAnswer(i -> i.getArgument(0));

            Sortie resultat = service.saisirSortie(sessionId, motif.getId(), new BigDecimal("500000"), date,
                    saisiParUtilisateurId, null, "Direction générale");

            assertThat(resultat.getCentreId()).isEmpty();
            verify(centreRepository, never()).findById(any(UUID.class));
        }

        @Test
        @DisplayName("refuse si le motif est de type ENTREE")
        void refuseSiMotifTypeIncorrect() {
            Motif motif = unMotifEntree();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));

            ThrowingCallable action = () -> service.saisirSortie(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, "Ordonnateur");

            assertThatThrownBy(action).isInstanceOf(MotifTypeIncorrectException.class);
        }

        @Test
        @DisplayName("refuse si le centre fourni n'existe pas")
        void refuseSiCentreFourniInexistant() {
            Motif motif = unMotifSortie();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.saisirSortie(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, "Ordonnateur");

            assertThatThrownBy(action).isInstanceOf(CentreIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la session est clôturée")
        void refuseSiSessionCloturee() {
            Motif motif = unMotifSortie();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable action = () -> service.saisirSortie(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, "Ordonnateur");

            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
        }
    }
}