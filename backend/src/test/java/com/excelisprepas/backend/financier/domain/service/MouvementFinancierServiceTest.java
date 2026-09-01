package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.*;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MouvementFinancierRepositoryPort;
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
import java.util.List;
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
    private MouvementFinancierRepositoryPort mouvementRepository;
    private com.excelisprepas.backend.inscription.domain.port.out.DossierInscriptionRepositoryPort dossierInscriptionRepository;

    @BeforeEach
    void setUp() {
        entreeRepository = mock(EntreeRepositoryPort.class);
        sortieRepository = mock(SortieRepositoryPort.class);
        motifRepository = mock(MotifRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        mouvementRepository = mock(MouvementFinancierRepositoryPort.class);
        dossierInscriptionRepository = mock(com.excelisprepas.backend.inscription.domain.port.out.DossierInscriptionRepositoryPort.class);
        service = new MouvementFinancierService(entreeRepository, sortieRepository, motifRepository,
                centreRepository, apprenantRepository, sessionRepository, mouvementRepository, dossierInscriptionRepository);
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
                    saisiParUtilisateurId, centreId, null, null);

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
                            centreId, null, null, null)));
            when(dossierInscriptionRepository.findByApprenantIdAndSessionId(apprenantId, sessionId)).thenReturn(List.of(
                    new com.excelisprepas.backend.inscription.domain.model.DossierInscription(
                            UUID.randomUUID(), apprenantId, sessionId, centreId, BigDecimal.ZERO, date,
                            false, null, List.of(UUID.randomUUID()), List.of(formationId), List.of())
            ));
            when(entreeRepository.save(any(Entree.class))).thenAnswer(i -> i.getArgument(0));

            // When
            Entree resultat = service.saisirEntree(sessionId, motif.getId(), new BigDecimal("15000"), date,
                    saisiParUtilisateurId, centreId, apprenantId, null);

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
                    saisiParUtilisateurId, centreId, null, null);

            assertThatThrownBy(action).isInstanceOf(MotifIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si le motif est inactif")
        void refuseSiMotifInactif() {
            Motif motif = unMotifEntree();
            motif.desactiver();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));

            ThrowingCallable action = () -> service.saisirEntree(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, null, null);

            assertThatThrownBy(action).isInstanceOf(MotifInactifException.class);
        }

        @Test
        @DisplayName("refuse si le motif est de type SORTIE")
        void refuseSiMotifTypeIncorrect() {
            Motif motif = unMotifSortie();
            when(motifRepository.findById(motif.getId())).thenReturn(Optional.of(motif));

            ThrowingCallable action = () -> service.saisirEntree(sessionId, motif.getId(), new BigDecimal("10000"),
                    date, saisiParUtilisateurId, centreId, null, null);

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
                    date, saisiParUtilisateurId, centreId, null, null);

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
                    date, saisiParUtilisateurId, centreId, null, null);

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
                    date, saisiParUtilisateurId, centreId, apprenantId, null);

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

    @Nested
    @DisplayName("Récupérer un mouvement")
    class RecupererMouvement {

        @Test
        @DisplayName("retourne le mouvement s'il existe")
        void recupererMouvementRetourneLeMouvement() {
            // Given
            Entree entree = new Entree(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("45000"),
                    date, saisiParUtilisateurId, centreId, null, null, null);
            when(mouvementRepository.findById(entree.getId())).thenReturn(Optional.of(entree));

            // When
            MouvementFinancier resultat = service.recupererMouvement(entree.getId());

            // Then
            assertThat(resultat).isEqualTo(entree);
        }

        @Test
        @DisplayName("lève une exception si le mouvement n'existe pas")
        void recupererMouvementLeveExceptionSiAbsent() {
            // Given
            UUID id = UUID.randomUUID();
            when(mouvementRepository.findById(id)).thenReturn(Optional.empty());

            // When
            ThrowingCallable action = () -> service.recupererMouvement(id);

            // Then
            assertThatThrownBy(action).isInstanceOf(MouvementFinancierIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Lister les mouvements")
    class ListerMouvements {

        @Test
        @DisplayName("sans filtre : combine toutes les Entree et Sortie de la session")
        void listerSansFiltreCombineToutesLesEntreeEtSortie() {
            // Given
            Entree entree = new Entree(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("45000"),
                    date, saisiParUtilisateurId, centreId, null, null, null);
            Sortie sortie = new Sortie(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("20000"),
                    date, saisiParUtilisateurId, centreId, "Ordonnateur");
            when(entreeRepository.findBySessionId(sessionId)).thenReturn(List.of(entree));
            when(sortieRepository.findBySessionId(sessionId)).thenReturn(List.of(sortie));

            // When
            List<MouvementFinancier> resultat = service.listerMouvements(sessionId, null, null);

            // Then
            assertThat(resultat).hasSize(2).contains(entree, sortie);
        }

        @Test
        @DisplayName("filtre par centre uniquement")
        void listerFiltreParCentre() {
            // Given
            when(entreeRepository.findBySessionIdAndCentreId(sessionId, centreId)).thenReturn(List.of());
            when(sortieRepository.findBySessionIdAndCentreId(sessionId, centreId)).thenReturn(List.of());

            // When
            service.listerMouvements(sessionId, centreId, null);

            // Then
            verify(entreeRepository).findBySessionIdAndCentreId(sessionId, centreId);
            verify(sortieRepository).findBySessionIdAndCentreId(sessionId, centreId);
            verify(entreeRepository, never()).findBySessionId(any(UUID.class));
        }

        @Test
        @DisplayName("filtre par statut uniquement (ex: EN_ATTENTE pour le Contrôleur financier)")
        void listerFiltreParStatut() {
            // Given
            when(entreeRepository.findBySessionIdAndStatut(sessionId, StatutMouvement.EN_ATTENTE)).thenReturn(List.of());
            when(sortieRepository.findBySessionIdAndStatut(sessionId, StatutMouvement.EN_ATTENTE)).thenReturn(List.of());

            // When
            service.listerMouvements(sessionId, null, StatutMouvement.EN_ATTENTE);

            // Then
            verify(entreeRepository).findBySessionIdAndStatut(sessionId, StatutMouvement.EN_ATTENTE);
            verify(sortieRepository).findBySessionIdAndStatut(sessionId, StatutMouvement.EN_ATTENTE);
        }

        @Test
        @DisplayName("combine centre et statut")
        void listerCombineCentreEtStatut() {
            // Given
            when(entreeRepository.findBySessionIdAndCentreIdAndStatut(sessionId, centreId, StatutMouvement.VALIDE))
                    .thenReturn(List.of());
            when(sortieRepository.findBySessionIdAndCentreIdAndStatut(sessionId, centreId, StatutMouvement.VALIDE))
                    .thenReturn(List.of());

            // When
            service.listerMouvements(sessionId, centreId, StatutMouvement.VALIDE);

            // Then
            verify(entreeRepository).findBySessionIdAndCentreIdAndStatut(sessionId, centreId, StatutMouvement.VALIDE);
            verify(sortieRepository).findBySessionIdAndCentreIdAndStatut(sessionId, centreId, StatutMouvement.VALIDE);
        }
    }

    @Nested
    @DisplayName("Lister les versements d'un apprenant")
    class ListerVersementsApprenant {

        @Test
        @DisplayName("retourne l'historique des entrees de l'apprenant")
        void listerVersementsRetourneLHistorique() {
            // Given
            UUID apprenantId = UUID.randomUUID();
            when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.of(
                    new Apprenant(apprenantId, "Essomba", "Paul", LocalDate.of(2005, 1, 1), date,
                            centreId, null, null, null)));
            List<Entree> versements = List.of(
                    new Entree(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("20000"),
                            date, saisiParUtilisateurId, centreId, apprenantId, null, null),
                    new Entree(UUID.randomUUID(), sessionId, UUID.randomUUID(), new BigDecimal("15000"),
                            date, saisiParUtilisateurId, centreId, apprenantId, null, null));
            when(entreeRepository.findByApprenantId(apprenantId)).thenReturn(versements);

            // When
            List<Entree> resultat = service.listerVersementsApprenant(apprenantId);

            // Then
            assertThat(resultat).hasSize(2);
        }

        @Test
        @DisplayName("refuse si l'apprenant n'existe pas")
        void listerVersementsRefuseSiApprenantInexistant() {
            // Given
            UUID apprenantId = UUID.randomUUID();
            when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable action = () -> service.listerVersementsApprenant(apprenantId);

            // Then
            assertThatThrownBy(action).isInstanceOf(ApprenantIntrouvableException.class);
            verify(entreeRepository, never()).findByApprenantId(any(UUID.class));
        }
    }
}