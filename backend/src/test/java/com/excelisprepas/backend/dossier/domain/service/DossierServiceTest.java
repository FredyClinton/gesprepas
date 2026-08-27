package com.excelisprepas.backend.dossier.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.dossier.domain.model.*;
import com.excelisprepas.backend.dossier.domain.port.out.*;
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

class DossierServiceTest {

    private final UUID apprenantId = UUID.randomUUID();
    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID concoursId = UUID.randomUUID();
    private final UUID pieceRequiseId = UUID.randomUUID();

    private DossierRepositoryPort dossierRepository;
    private DossierConcoursRepositoryPort dossierConcoursRepository;
    private PieceDossierRepositoryPort pieceDossierRepository;
    private ApprenantRepositoryPort apprenantRepository;
    private ConcoursRepositoryPort concoursRepository;
    private ConcoursPieceRequiseRepositoryPort concoursPieceRequiseRepository;
    private PieceRequiseRepositoryPort pieceRequiseRepository;
    private DossierService service;

    @BeforeEach
    void setUp() {
        dossierRepository = mock(DossierRepositoryPort.class);
        dossierConcoursRepository = mock(DossierConcoursRepositoryPort.class);
        pieceDossierRepository = mock(PieceDossierRepositoryPort.class);
        apprenantRepository = mock(ApprenantRepositoryPort.class);
        concoursRepository = mock(ConcoursRepositoryPort.class);
        concoursPieceRequiseRepository = mock(ConcoursPieceRequiseRepositoryPort.class);
        pieceRequiseRepository = mock(PieceRequiseRepositoryPort.class);
        service = new DossierService(dossierRepository, dossierConcoursRepository, pieceDossierRepository,
                apprenantRepository, concoursRepository, concoursPieceRequiseRepository, pieceRequiseRepository);
    }

    private Apprenant unApprenant() {
        return new Apprenant(apprenantId, "Essomba", "Paul", LocalDate.of(2005, 1, 1), LocalDate.of(2026, 9, 1),
                new BigDecimal("50000"), LocalDate.of(2026, 9, 1), centreId, sessionId, UUID.randomUUID());
    }

    private Dossier unDossierOuvert() {
        return new Dossier(UUID.randomUUID(), apprenantId, centreId, sessionId, LocalDate.of(2027, 1, 10));
    }

    private Concours unConcours() {
        return new Concours(concoursId, "ENSPY", sessionId, LocalDate.of(2027, 6, 30), LocalDate.of(2027, 6, 15));
    }

    @Nested
    @DisplayName("Ouverture de dossier")
    class Ouverture {

        @Test
        @DisplayName("ouvre un dossier pour un apprenant sans dossier existant")
        void ouvreDossierReussit() {
            when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.of(unApprenant()));
            when(dossierRepository.existsByApprenantId(apprenantId)).thenReturn(false);
            when(dossierRepository.save(any(Dossier.class))).thenAnswer(i -> i.getArgument(0));

            Dossier resultat = service.ouvrirDossier(apprenantId);

            assertThat(resultat.getApprenantId()).isEqualTo(apprenantId);
            assertThat(resultat.getCentreId()).isEqualTo(centreId);
            assertThat(resultat.getSessionId()).isEqualTo(sessionId);
            assertThat(resultat.getStatut()).isEqualTo(StatutDossier.OUVERT);
        }

        @Test
        @DisplayName("refuse si l'apprenant n'existe pas")
        void refuseSiApprenantInexistant() {
            when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ouvrirDossier(apprenantId);

            assertThatThrownBy(action).isInstanceOf(ApprenantIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si un dossier existe déjà pour cet apprenant")
        void refuseSiDossierDejaExistant() {
            when(apprenantRepository.findById(apprenantId)).thenReturn(Optional.of(unApprenant()));
            when(dossierRepository.existsByApprenantId(apprenantId)).thenReturn(true);

            ThrowingCallable action = () -> service.ouvrirDossier(apprenantId);

            assertThatThrownBy(action).isInstanceOf(DossierDejaExistantException.class);
            verify(dossierRepository, never()).save(any(Dossier.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererDossier retourne le dossier s'il existe")
        void recupererDossierRetourneLeDossier() {
            Dossier dossier = unDossierOuvert();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));

            Dossier resultat = service.recupererDossier(dossier.getId());

            assertThat(resultat).isEqualTo(dossier);
        }

        @Test
        @DisplayName("recupererDossier lève une exception si absent")
        void recupererDossierLeveExceptionSiAbsent() {
            UUID id = UUID.randomUUID();
            when(dossierRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.recupererDossier(id);

            assertThatThrownBy(action).isInstanceOf(DossierIntrouvableException.class);
        }

        @Test
        @DisplayName("recupererDossierParApprenant retourne le dossier de l'apprenant")
        void recupererDossierParApprenantRetourneLeDossier() {
            Dossier dossier = unDossierOuvert();
            when(dossierRepository.findByApprenantId(apprenantId)).thenReturn(Optional.of(dossier));

            Dossier resultat = service.recupererDossierParApprenant(apprenantId);

            assertThat(resultat).isEqualTo(dossier);
        }

        @Test
        @DisplayName("recupererDossierParApprenant lève une exception si aucun dossier")
        void recupererDossierParApprenantLeveExceptionSiAbsent() {
            when(dossierRepository.findByApprenantId(apprenantId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.recupererDossierParApprenant(apprenantId);

            assertThatThrownBy(action).isInstanceOf(DossierIntrouvablePourApprenantException.class);
        }
    }

    @Nested
    @DisplayName("Observation")
    class Observation {

        @Test
        @DisplayName("modifierObservation met à jour et sauvegarde")
        void modifierObservationMetAJourEtSauvegarde() {
            Dossier dossier = unDossierOuvert();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(dossierRepository.save(any(Dossier.class))).thenAnswer(i -> i.getArgument(0));

            Dossier resultat = service.modifierObservation(dossier.getId(), "En attente de l'acte de naissance");

            assertThat(resultat.getObservation()).contains("En attente de l'acte de naissance");
        }

        @Test
        @DisplayName("modifierObservation propage l'exception si le dossier est clôturé")
        void modifierObservationPropageExceptionSiCloture() {
            Dossier dossier = unDossierOuvert();
            dossier.marquerComplet();
            dossier.cloturer(LocalDate.of(2027, 2, 1));
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));

            ThrowingCallable action = () -> service.modifierObservation(dossier.getId(), "Trop tard");

            assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Ajouter un concours au dossier")
    class AjouterConcours {

        private List<SelectionPiece> uneSelection() {
            return List.of(new SelectionPiece(pieceRequiseId, 2));
        }

        @Test
        @DisplayName("ajoute le concours, crée les PieceDossier, calcule le montant total")
        void ajouteConcoursReussit() {
            Dossier dossier = unDossierOuvert();
            Concours concours = unConcours();
            PieceRequise piece = new PieceRequise(pieceRequiseId, "Acte de naissance", new BigDecimal("500"));

            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(concoursRepository.findById(concoursId)).thenReturn(Optional.of(concours));
            when(dossierConcoursRepository.existsByDossierIdAndConcoursId(dossier.getId(), concoursId)).thenReturn(false);
            when(concoursPieceRequiseRepository.existsByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId)).thenReturn(true);
            when(dossierConcoursRepository.save(any(DossierConcours.class))).thenAnswer(i -> i.getArgument(0));
            when(pieceDossierRepository.save(any(PieceDossier.class))).thenAnswer(i -> i.getArgument(0));
            when(pieceDossierRepository.findByDossierConcoursId(any(UUID.class))).thenAnswer(invocation ->
                    List.of(new PieceDossier(UUID.randomUUID(), invocation.getArgument(0), pieceRequiseId, 2)));
            when(pieceRequiseRepository.findById(pieceRequiseId)).thenReturn(Optional.of(piece));

            DossierConcours resultat = service.ajouterConcoursAuDossier(dossier.getId(), concoursId, uneSelection());

            assertThat(resultat.getDossierId()).isEqualTo(dossier.getId());
            assertThat(resultat.getConcoursId()).isEqualTo(concoursId);
            assertThat(resultat.getMontantTotal()).isEqualByComparingTo("1000"); // 500 x 2
        }

        @Test
        @DisplayName("refuse si le dossier n'existe pas")
        void refuseSiDossierIntrouvable() {
            UUID dossierId = UUID.randomUUID();
            when(dossierRepository.findById(dossierId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ajouterConcoursAuDossier(dossierId, concoursId, uneSelection());

            assertThatThrownBy(action).isInstanceOf(DossierIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si le dossier n'est pas Ouvert")
        void refuseSiDossierNonOuvert() {
            Dossier dossier = unDossierOuvert();
            dossier.marquerComplet();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));

            ThrowingCallable action = () -> service.ajouterConcoursAuDossier(dossier.getId(), concoursId, uneSelection());

            assertThatThrownBy(action).isInstanceOf(DossierNonOuvertException.class);
        }

        @Test
        @DisplayName("refuse si aucune pièce n'est sélectionnée")
        void refuseSiAucunePieceSelectionnee() {
            Dossier dossier = unDossierOuvert();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));

            ThrowingCallable action = () -> service.ajouterConcoursAuDossier(dossier.getId(), concoursId, List.of());

            assertThatThrownBy(action).isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("refuse si le concours n'existe pas")
        void refuseSiConcoursIntrouvable() {
            Dossier dossier = unDossierOuvert();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(concoursRepository.findById(concoursId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ajouterConcoursAuDossier(dossier.getId(), concoursId, uneSelection());

            assertThatThrownBy(action).isInstanceOf(ConcoursIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la date limite du concours est dépassée")
        void refuseSiDateLimiteDepassee() {
            Dossier dossier = unDossierOuvert();
            Concours concoursExpire = new Concours(concoursId, "ENSPY", sessionId,
                    LocalDate.of(2020, 6, 30), LocalDate.of(2020, 6, 15));
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(concoursRepository.findById(concoursId)).thenReturn(Optional.of(concoursExpire));

            ThrowingCallable action = () -> service.ajouterConcoursAuDossier(dossier.getId(), concoursId, uneSelection());

            assertThatThrownBy(action).isInstanceOf(ConcoursDateLimiteDepasseeException.class);
        }

        @Test
        @DisplayName("refuse si le concours est déjà ajouté à ce dossier")
        void refuseSiConcoursDejaAjoute() {
            Dossier dossier = unDossierOuvert();
            Concours concours = unConcours();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(concoursRepository.findById(concoursId)).thenReturn(Optional.of(concours));
            when(dossierConcoursRepository.existsByDossierIdAndConcoursId(dossier.getId(), concoursId)).thenReturn(true);

            ThrowingCallable action = () -> service.ajouterConcoursAuDossier(dossier.getId(), concoursId, uneSelection());

            assertThatThrownBy(action).isInstanceOf(ConcoursDejaAjouteAuDossierException.class);
        }

        @Test
        @DisplayName("refuse si une pièce sélectionnée n'appartient pas au concours")
        void refuseSiPieceNonRattacheeAuConcours() {
            Dossier dossier = unDossierOuvert();
            Concours concours = unConcours();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(concoursRepository.findById(concoursId)).thenReturn(Optional.of(concours));
            when(dossierConcoursRepository.existsByDossierIdAndConcoursId(dossier.getId(), concoursId)).thenReturn(false);
            when(concoursPieceRequiseRepository.existsByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId)).thenReturn(false);

            ThrowingCallable action = () -> service.ajouterConcoursAuDossier(dossier.getId(), concoursId, uneSelection());

            assertThatThrownBy(action).isInstanceOf(PieceNonAjouteeAuConcoursException.class);
            verify(dossierConcoursRepository, never()).save(any(DossierConcours.class));
        }
    }

    @Nested
    @DisplayName("Ajouter une pièce à un DossierConcours existant")
    class AjouterPiece {

        @Test
        @DisplayName("crée une nouvelle PieceDossier si elle n'existe pas encore")
        void ajoutePieceNouvelleReussit() {
            DossierConcours dossierConcours = new DossierConcours(
                    UUID.randomUUID(), UUID.randomUUID(), concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15));
            Dossier dossier = unDossierOuvert();
            PieceRequise piece = new PieceRequise(pieceRequiseId, "Photo", new BigDecimal("200"));

            when(dossierConcoursRepository.findById(dossierConcours.getId())).thenReturn(Optional.of(dossierConcours));
            when(dossierRepository.findById(dossierConcours.getDossierId())).thenReturn(Optional.of(dossier));
            when(concoursPieceRequiseRepository.existsByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId)).thenReturn(true);
            when(pieceDossierRepository.findByDossierConcoursIdAndPieceRequiseId(dossierConcours.getId(), pieceRequiseId))
                    .thenReturn(Optional.empty());
            when(pieceDossierRepository.save(any(PieceDossier.class))).thenAnswer(i -> i.getArgument(0));
            when(pieceDossierRepository.findByDossierConcoursId(dossierConcours.getId())).thenReturn(List.of());
            when(dossierConcoursRepository.save(any(DossierConcours.class))).thenAnswer(i -> i.getArgument(0));

            PieceDossier resultat = service.ajouterPieceADossierConcours(dossierConcours.getId(), pieceRequiseId, 1);

            assertThat(resultat.getPieceRequiseId()).isEqualTo(pieceRequiseId);
            assertThat(resultat.getQuantite()).isEqualTo(1);
        }

        @Test
        @DisplayName("augmente la quantité si la PieceDossier existe déjà")
        void augmenteQuantiteSiExistante() {
            DossierConcours dossierConcours = new DossierConcours(
                    UUID.randomUUID(), UUID.randomUUID(), concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15));
            Dossier dossier = unDossierOuvert();
            PieceDossier pieceExistante = new PieceDossier(UUID.randomUUID(), dossierConcours.getId(), pieceRequiseId, 1);

            when(dossierConcoursRepository.findById(dossierConcours.getId())).thenReturn(Optional.of(dossierConcours));
            when(dossierRepository.findById(dossierConcours.getDossierId())).thenReturn(Optional.of(dossier));
            when(concoursPieceRequiseRepository.existsByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId)).thenReturn(true);
            when(pieceDossierRepository.findByDossierConcoursIdAndPieceRequiseId(dossierConcours.getId(), pieceRequiseId))
                    .thenReturn(Optional.of(pieceExistante));
            when(pieceDossierRepository.save(any(PieceDossier.class))).thenAnswer(i -> i.getArgument(0));
            when(pieceDossierRepository.findByDossierConcoursId(dossierConcours.getId())).thenReturn(List.of());
            when(dossierConcoursRepository.save(any(DossierConcours.class))).thenAnswer(i -> i.getArgument(0));

            PieceDossier resultat = service.ajouterPieceADossierConcours(dossierConcours.getId(), pieceRequiseId, 2);

            assertThat(resultat.getQuantite()).isEqualTo(3); // 1 + 2
        }

        @Test
        @DisplayName("refuse si le DossierConcours n'existe pas")
        void refuseSiDossierConcoursIntrouvable() {
            UUID dossierConcoursId = UUID.randomUUID();
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ajouterPieceADossierConcours(dossierConcoursId, pieceRequiseId, 1);

            assertThatThrownBy(action).isInstanceOf(DossierConcoursIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si le dossier n'est pas Ouvert")
        void refuseSiDossierNonOuvert() {
            DossierConcours dossierConcours = new DossierConcours(
                    UUID.randomUUID(), UUID.randomUUID(), concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15));
            Dossier dossier = unDossierOuvert();
            dossier.marquerComplet();

            when(dossierConcoursRepository.findById(dossierConcours.getId())).thenReturn(Optional.of(dossierConcours));
            when(dossierRepository.findById(dossierConcours.getDossierId())).thenReturn(Optional.of(dossier));

            ThrowingCallable action = () -> service.ajouterPieceADossierConcours(dossierConcours.getId(), pieceRequiseId, 1);

            assertThatThrownBy(action).isInstanceOf(DossierNonOuvertException.class);
        }

        @Test
        @DisplayName("refuse si la pièce n'appartient pas au concours")
        void refuseSiPieceNonRattacheeAuConcours() {
            DossierConcours dossierConcours = new DossierConcours(
                    UUID.randomUUID(), UUID.randomUUID(), concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15));
            Dossier dossier = unDossierOuvert();

            when(dossierConcoursRepository.findById(dossierConcours.getId())).thenReturn(Optional.of(dossierConcours));
            when(dossierRepository.findById(dossierConcours.getDossierId())).thenReturn(Optional.of(dossier));
            when(concoursPieceRequiseRepository.existsByConcoursIdAndPieceRequiseId(concoursId, pieceRequiseId)).thenReturn(false);

            ThrowingCallable action = () -> service.ajouterPieceADossierConcours(dossierConcours.getId(), pieceRequiseId, 1);

            assertThatThrownBy(action).isInstanceOf(PieceNonAjouteeAuConcoursException.class);
        }
    }

    @Nested
    @DisplayName("Listage")
    class Listage {

        @Test
        @DisplayName("listerDossierConcours retourne les concours du dossier")
        void listerDossierConcoursRetourneLesConcours() {
            Dossier dossier = unDossierOuvert();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(dossierConcoursRepository.findByDossierId(dossier.getId())).thenReturn(List.of(
                    new DossierConcours(UUID.randomUUID(), dossier.getId(), concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15))));

            List<DossierConcours> resultat = service.listerDossierConcours(dossier.getId());

            assertThat(resultat).hasSize(1);
        }

        @Test
        @DisplayName("listerPiecesDossier retourne les pièces du DossierConcours")
        void listerPiecesDossierRetourneLesPieces() {
            UUID dossierConcoursId = UUID.randomUUID();
            DossierConcours dossierConcours = new DossierConcours(
                    dossierConcoursId, UUID.randomUUID(), concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15));
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.of(dossierConcours));
            when(pieceDossierRepository.findByDossierConcoursId(dossierConcoursId)).thenReturn(List.of(
                    new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 1)));

            List<PieceDossier> resultat = service.listerPiecesDossier(dossierConcoursId);

            assertThat(resultat).hasSize(1);
        }

        @Test
        @DisplayName("listerPiecesDossier refuse si le DossierConcours n'existe pas")
        void listerPiecesDossierRefuseSiIntrouvable() {
            UUID dossierConcoursId = UUID.randomUUID();
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.listerPiecesDossier(dossierConcoursId);

            assertThatThrownBy(action).isInstanceOf(DossierConcoursIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Valider une pièce déposée")
    class ValiderPiece {

        @Test
        @DisplayName("valide la pièce si le dossier n'est pas clôturé")
        void validePieceReussit() {
            UUID dossierConcoursId = UUID.randomUUID();
            UUID dossierId = UUID.randomUUID();
            PieceDossier pieceDossier = new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 1);
            DossierConcours dossierConcours = new DossierConcours(
                    dossierConcoursId, dossierId, concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15));
            Dossier dossier = Dossier.reconstituer(dossierId, apprenantId, centreId, sessionId,
                    StatutDossier.OUVERT, LocalDate.of(2027, 1, 10), null, null);

            when(pieceDossierRepository.findById(pieceDossier.getId())).thenReturn(Optional.of(pieceDossier));
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.of(dossierConcours));
            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(dossier));
            when(pieceDossierRepository.save(any(PieceDossier.class))).thenAnswer(i -> i.getArgument(0));

            PieceDossier resultat = service.validerPieceDeposee(pieceDossier.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutPieceDossier.VALIDEE);
        }

        @Test
        @DisplayName("refuse si la PieceDossier n'existe pas")
        void refuseSiPieceIntrouvable() {
            UUID id = UUID.randomUUID();
            when(pieceDossierRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.validerPieceDeposee(id);

            assertThatThrownBy(action).isInstanceOf(PieceDossierIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si le dossier est clôturé")
        void refuseSiDossierCloture() {
            UUID dossierConcoursId = UUID.randomUUID();
            UUID dossierId = UUID.randomUUID();
            PieceDossier pieceDossier = new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 1);
            DossierConcours dossierConcours = new DossierConcours(
                    dossierConcoursId, dossierId, concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15));
            Dossier dossierCloture = Dossier.reconstituer(dossierId, apprenantId, centreId, sessionId,
                    StatutDossier.CLOTURE, LocalDate.of(2027, 1, 10), LocalDate.of(2027, 2, 1), null);

            when(pieceDossierRepository.findById(pieceDossier.getId())).thenReturn(Optional.of(pieceDossier));
            when(dossierConcoursRepository.findById(dossierConcoursId)).thenReturn(Optional.of(dossierConcours));
            when(dossierRepository.findById(dossierId)).thenReturn(Optional.of(dossierCloture));

            ThrowingCallable action = () -> service.validerPieceDeposee(pieceDossier.getId());

            assertThatThrownBy(action).isInstanceOf(DossierClotureException.class);
        }
    }

    @Nested
    @DisplayName("Signaler complet")
    class SignalerComplet {

        @Test
        @DisplayName("marque le dossier Complet si toutes les pièces de tous les concours sont validées")
        void signaleCompletReussit() {
            Dossier dossier = unDossierOuvert();
            UUID dossierConcoursId = UUID.randomUUID();
            DossierConcours dossierConcours = new DossierConcours(
                    dossierConcoursId, dossier.getId(), concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15));
            PieceDossier pieceValidee = PieceDossier.reconstituer(
                    UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 1, StatutPieceDossier.VALIDEE, LocalDate.of(2027, 1, 20));

            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(dossierConcoursRepository.findByDossierId(dossier.getId())).thenReturn(List.of(dossierConcours));
            when(pieceDossierRepository.findByDossierConcoursId(dossierConcoursId)).thenReturn(List.of(pieceValidee));
            when(dossierRepository.save(any(Dossier.class))).thenAnswer(i -> i.getArgument(0));

            Dossier resultat = service.signalerDossierComplet(dossier.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutDossier.COMPLET);
        }

        @Test
        @DisplayName("refuse si le dossier n'est pas Ouvert")
        void refuseSiDossierNonOuvert() {
            Dossier dossier = unDossierOuvert();
            dossier.marquerComplet();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));

            ThrowingCallable action = () -> service.signalerDossierComplet(dossier.getId());

            assertThatThrownBy(action).isInstanceOf(DossierNonOuvertException.class);
        }

        @Test
        @DisplayName("refuse si le dossier n'a aucun concours rattaché")
        void refuseSiAucunConcours() {
            Dossier dossier = unDossierOuvert();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(dossierConcoursRepository.findByDossierId(dossier.getId())).thenReturn(List.of());

            ThrowingCallable action = () -> service.signalerDossierComplet(dossier.getId());

            assertThatThrownBy(action).isInstanceOf(DossierSansConcoursException.class);
        }

        @Test
        @DisplayName("refuse si au moins une pièce n'est pas validée")
        void refuseSiUnePieceNonValidee() {
            Dossier dossier = unDossierOuvert();
            UUID dossierConcoursId = UUID.randomUUID();
            DossierConcours dossierConcours = new DossierConcours(
                    dossierConcoursId, dossier.getId(), concoursId, centreId, sessionId, LocalDate.of(2027, 1, 15));
            PieceDossier pieceEnAttente = new PieceDossier(UUID.randomUUID(), dossierConcoursId, pieceRequiseId, 1);

            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(dossierConcoursRepository.findByDossierId(dossier.getId())).thenReturn(List.of(dossierConcours));
            when(pieceDossierRepository.findByDossierConcoursId(dossierConcoursId)).thenReturn(List.of(pieceEnAttente));

            ThrowingCallable action = () -> service.signalerDossierComplet(dossier.getId());

            assertThatThrownBy(action).isInstanceOf(PiecesNonToutesValideesException.class);
            verify(dossierRepository, never()).save(any(Dossier.class));
        }
    }

    @Nested
    @DisplayName("Clôture")
    class Cloture {

        @Test
        @DisplayName("cloturerDossier clôture un dossier Complet")
        void cloturerDossierReussit() {
            Dossier dossier = unDossierOuvert();
            dossier.marquerComplet();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));
            when(dossierRepository.save(any(Dossier.class))).thenAnswer(i -> i.getArgument(0));

            Dossier resultat = service.cloturerDossier(dossier.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutDossier.CLOTURE);
        }

        @Test
        @DisplayName("cloturerDossier propage l'exception si le dossier n'est pas Complet")
        void cloturerDossierPropageExceptionSiPasComplet() {
            Dossier dossier = unDossierOuvert();
            when(dossierRepository.findById(dossier.getId())).thenReturn(Optional.of(dossier));

            ThrowingCallable action = () -> service.cloturerDossier(dossier.getId());

            assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
        }
    }
}