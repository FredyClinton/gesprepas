package com.excelisprepas.backend.dossier.domain.service;

import com.excelisprepas.backend.dossier.domain.model.Concours;
import com.excelisprepas.backend.dossier.domain.model.ConcoursPieceRequise;
import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursPieceRequiseRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.PieceRequiseRepositoryPort;
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

class ConcoursServiceTest {

    private final UUID sessionId = UUID.randomUUID();
    private final LocalDate dateLimiteDepot = LocalDate.of(2027, 6, 30);
    private final LocalDate dateLimiteRecevabiliteCentre = LocalDate.of(2027, 6, 15);

    private final UUID formationId = UUID.randomUUID();
    private final UUID phaseId = UUID.randomUUID();

    private ConcoursRepositoryPort concoursRepository;
    private ConcoursPieceRequiseRepositoryPort associationRepository;
    private PieceRequiseRepositoryPort pieceRequiseRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private ConcoursService service;

    @BeforeEach
    void setUp() {
        concoursRepository = mock(ConcoursRepositoryPort.class);
        associationRepository = mock(ConcoursPieceRequiseRepositoryPort.class);
        pieceRequiseRepository = mock(PieceRequiseRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        service = new ConcoursService(concoursRepository, associationRepository, pieceRequiseRepository, sessionRepository);
    }

    private Concours unConcours() {
        return new Concours(UUID.randomUUID(), "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);
    }

    private SessionAcademique uneSessionEnCours() {
        return SessionAcademique.reconstituer(sessionId, "2026-2027",
                LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS);
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée un concours quand la session existe et n'est pas clôturée")
        void creeUnConcoursQuandSessionValide() {
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(concoursRepository.save(any(Concours.class))).thenAnswer(i -> i.getArgument(0));

            Concours resultat = service.creerConcours("ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

            assertThat(resultat.getNom()).isEqualTo("ENSPY");
            assertThat(resultat.getSessionId()).isEqualTo(sessionId);
        }

        @Test
        @DisplayName("refuse si la session n'existe pas")
        void refuseSiSessionIntrouvable() {
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.creerConcours(
                    "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

            assertThatThrownBy(action).isInstanceOf(SessionIntrouvableException.class);
            verify(concoursRepository, never()).save(any(Concours.class));
        }

        @Test
        @DisplayName("refuse si la session est clôturée")
        void refuseSiSessionCloturee() {
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable action = () -> service.creerConcours(
                    "ENSPY", sessionId, formationId, phaseId, dateLimiteDepot, dateLimiteRecevabiliteCentre);

            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
        }
    }

    @Nested
    @DisplayName("Récupération et listage")
    class RecuperationEtListage {

        @Test
        @DisplayName("recupererConcours retourne le concours s'il existe")
        void recupererConcoursRetourneLeConcours() {
            Concours concours = unConcours();
            when(concoursRepository.findById(concours.getId())).thenReturn(Optional.of(concours));

            Concours resultat = service.recupererConcours(concours.getId());

            assertThat(resultat).isEqualTo(concours);
        }

        @Test
        @DisplayName("recupererConcours lève une exception si absent")
        void recupererConcoursLeveExceptionSiAbsent() {
            UUID id = UUID.randomUUID();
            when(concoursRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.recupererConcours(id);

            assertThatThrownBy(action).isInstanceOf(ConcoursIntrouvableException.class);
        }

        @Test
        @DisplayName("listerConcours retourne les concours de la session")
        void listerConcoursRetourneLesConcoursDeLaSession() {
            when(concoursRepository.findBySessionId(sessionId)).thenReturn(List.of(unConcours(), unConcours()));

            List<Concours> resultat = service.listerConcours(sessionId);

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Ajouter une pièce au concours")
    class AjouterPiece {

        @Test
        @DisplayName("ajoute la pièce quand elle existe, est active, et n'est pas déjà rattachée")
        void ajoutePieceReussit() {
            Concours concours = unConcours();
            PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Acte de naissance", new BigDecimal("500"));
            when(concoursRepository.findById(concours.getId())).thenReturn(Optional.of(concours));
            when(pieceRequiseRepository.findById(piece.getId())).thenReturn(Optional.of(piece));
            when(associationRepository.existsByConcoursIdAndPieceRequiseId(concours.getId(), piece.getId())).thenReturn(false);
            when(associationRepository.save(any(ConcoursPieceRequise.class))).thenAnswer(i -> i.getArgument(0));

            ConcoursPieceRequise resultat = service.ajouterPieceAuConcours(concours.getId(), piece.getId());

            assertThat(resultat.getConcoursId()).isEqualTo(concours.getId());
            assertThat(resultat.getPieceRequiseId()).isEqualTo(piece.getId());
        }

        @Test
        @DisplayName("refuse si le concours n'existe pas")
        void refuseSiConcoursIntrouvable() {
            UUID concoursId = UUID.randomUUID();
            when(concoursRepository.findById(concoursId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ajouterPieceAuConcours(concoursId, UUID.randomUUID());

            assertThatThrownBy(action).isInstanceOf(ConcoursIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la pièce n'existe pas")
        void refuseSiPieceIntrouvable() {
            Concours concours = unConcours();
            UUID pieceId = UUID.randomUUID();
            when(concoursRepository.findById(concours.getId())).thenReturn(Optional.of(concours));
            when(pieceRequiseRepository.findById(pieceId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ajouterPieceAuConcours(concours.getId(), pieceId);

            assertThatThrownBy(action).isInstanceOf(PieceRequiseIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la pièce est désactivée")
        void refuseSiPieceInactive() {
            Concours concours = unConcours();
            PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Acte de naissance", new BigDecimal("500"));
            piece.desactiver();
            when(concoursRepository.findById(concours.getId())).thenReturn(Optional.of(concours));
            when(pieceRequiseRepository.findById(piece.getId())).thenReturn(Optional.of(piece));

            ThrowingCallable action = () -> service.ajouterPieceAuConcours(concours.getId(), piece.getId());

            assertThatThrownBy(action).isInstanceOf(PieceRequiseInactiveException.class);
        }

        @Test
        @DisplayName("refuse si la pièce est déjà rattachée au concours")
        void refuseSiDejaRattachee() {
            Concours concours = unConcours();
            PieceRequise piece = new PieceRequise(UUID.randomUUID(), "Acte de naissance", new BigDecimal("500"));
            when(concoursRepository.findById(concours.getId())).thenReturn(Optional.of(concours));
            when(pieceRequiseRepository.findById(piece.getId())).thenReturn(Optional.of(piece));
            when(associationRepository.existsByConcoursIdAndPieceRequiseId(concours.getId(), piece.getId())).thenReturn(true);

            ThrowingCallable action = () -> service.ajouterPieceAuConcours(concours.getId(), piece.getId());

            assertThatThrownBy(action).isInstanceOf(PieceDejaAjouteeAuConcoursException.class);
            verify(associationRepository, never()).save(any(ConcoursPieceRequise.class));
        }
    }

    @Nested
    @DisplayName("Retirer une pièce du concours")
    class RetirerPiece {

        @Test
        @DisplayName("retire l'association existante")
        void retirePieceReussit() {
            UUID concoursId = UUID.randomUUID();
            UUID pieceId = UUID.randomUUID();
            ConcoursPieceRequise association = new ConcoursPieceRequise(UUID.randomUUID(), concoursId, pieceId);
            when(associationRepository.findByConcoursIdAndPieceRequiseId(concoursId, pieceId))
                    .thenReturn(Optional.of(association));

            service.retirerPieceDuConcours(concoursId, pieceId);

            verify(associationRepository).deleteById(association.getId());
        }

        @Test
        @DisplayName("refuse si l'association n'existe pas")
        void refuseSiAssociationInexistante() {
            UUID concoursId = UUID.randomUUID();
            UUID pieceId = UUID.randomUUID();
            when(associationRepository.findByConcoursIdAndPieceRequiseId(concoursId, pieceId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.retirerPieceDuConcours(concoursId, pieceId);

            assertThatThrownBy(action).isInstanceOf(PieceNonAjouteeAuConcoursException.class);
        }
    }

    @Nested
    @DisplayName("Lister les pièces d'un concours")
    class ListerPieces {

        @Test
        @DisplayName("retourne les pièces rattachées au concours")
        void listerPiecesRetourneLesPiecesRattachees() {
            Concours concours = unConcours();
            PieceRequise piece1 = new PieceRequise(UUID.randomUUID(), "Acte de naissance", new BigDecimal("500"));
            PieceRequise piece2 = new PieceRequise(UUID.randomUUID(), "Caution", new BigDecimal("2000"));
            ConcoursPieceRequise assoc1 = new ConcoursPieceRequise(UUID.randomUUID(), concours.getId(), piece1.getId());
            ConcoursPieceRequise assoc2 = new ConcoursPieceRequise(UUID.randomUUID(), concours.getId(), piece2.getId());

            when(concoursRepository.findById(concours.getId())).thenReturn(Optional.of(concours));
            when(associationRepository.findByConcoursId(concours.getId())).thenReturn(List.of(assoc1, assoc2));
            when(pieceRequiseRepository.findById(piece1.getId())).thenReturn(Optional.of(piece1));
            when(pieceRequiseRepository.findById(piece2.getId())).thenReturn(Optional.of(piece2));

            List<PieceRequise> resultat = service.listerPiecesDuConcours(concours.getId());

            assertThat(resultat).hasSize(2).contains(piece1, piece2);
        }

        @Test
        @DisplayName("refuse si le concours n'existe pas")
        void refuseSiConcoursIntrouvable() {
            UUID concoursId = UUID.randomUUID();
            when(concoursRepository.findById(concoursId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.listerPiecesDuConcours(concoursId);

            assertThatThrownBy(action).isInstanceOf(ConcoursIntrouvableException.class);
        }
    }
}