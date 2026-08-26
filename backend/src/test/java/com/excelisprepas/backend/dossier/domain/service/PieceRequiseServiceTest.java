package com.excelisprepas.backend.dossier.domain.service;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.port.out.PieceRequiseRepositoryPort;
import com.excelisprepas.backend.shared.exception.PieceRequiseIntrouvableException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class PieceRequiseServiceTest {

    private PieceRequiseRepositoryPort repository;
    private PieceRequiseService service;

    @BeforeEach
    void setUp() {
        repository = mock(PieceRequiseRepositoryPort.class);
        service = new PieceRequiseService(repository);
    }

    private PieceRequise unePieceRequise() {
        return new PieceRequise(UUID.randomUUID(), "Acte de naissance", new BigDecimal("500"));
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée une pièce requise")
        void creeUnePieceRequise() {
            when(repository.save(any(PieceRequise.class))).thenAnswer(i -> i.getArgument(0));

            PieceRequise resultat = service.creerPieceRequise("Caution", new BigDecimal("2000"));

            assertThat(resultat.getNom()).isEqualTo("Caution");
            assertThat(resultat.getMontant()).isEqualByComparingTo("2000");
            assertThat(resultat.isActif()).isTrue();
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("modifierPieceRequise renomme et met à jour le montant")
        void modifierPieceRequiseRenommeEtMetAJourMontant() {
            PieceRequise piece = unePieceRequise();
            when(repository.findById(piece.getId())).thenReturn(Optional.of(piece));
            when(repository.save(any(PieceRequise.class))).thenAnswer(i -> i.getArgument(0));

            PieceRequise resultat = service.modifierPieceRequise(piece.getId(), "Relevé de notes", new BigDecimal("800"));

            assertThat(resultat.getNom()).isEqualTo("Relevé de notes");
            assertThat(resultat.getMontant()).isEqualByComparingTo("800");
        }

        @Test
        @DisplayName("modifierPieceRequise refuse si la pièce n'existe pas")
        void modifierPieceRequiseRefuseSiInexistante() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.modifierPieceRequise(id, "Nouveau nom", new BigDecimal("100"));

            assertThatThrownBy(action).isInstanceOf(PieceRequiseIntrouvableException.class);
        }

        @Test
        @DisplayName("desactiverPieceRequise désactive et sauvegarde")
        void desactiverPieceRequiseDesactive() {
            PieceRequise piece = unePieceRequise();
            when(repository.findById(piece.getId())).thenReturn(Optional.of(piece));
            when(repository.save(any(PieceRequise.class))).thenAnswer(i -> i.getArgument(0));

            PieceRequise resultat = service.desactiverPieceRequise(piece.getId());

            assertThat(resultat.isActif()).isFalse();
        }

        @Test
        @DisplayName("desactiverPieceRequise refuse si la pièce n'existe pas")
        void desactiverPieceRequiseRefuseSiInexistante() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.desactiverPieceRequise(id);

            assertThatThrownBy(action).isInstanceOf(PieceRequiseIntrouvableException.class);
        }

        @Test
        @DisplayName("reactiverPieceRequise réactive et sauvegarde")
        void reactiverPieceRequiseReactive() {
            PieceRequise piece = unePieceRequise();
            piece.desactiver();
            when(repository.findById(piece.getId())).thenReturn(Optional.of(piece));
            when(repository.save(any(PieceRequise.class))).thenAnswer(i -> i.getArgument(0));

            PieceRequise resultat = service.reactiverPieceRequise(piece.getId());

            assertThat(resultat.isActif()).isTrue();
        }
    }

    @Nested
    @DisplayName("Listage")
    class Listage {

        @Test
        @DisplayName("listerPiecesRequises retourne toutes les pièces")
        void listerPiecesRequisesRetourneToutesLesPieces() {
            when(repository.findAll()).thenReturn(List.of(unePieceRequise(), unePieceRequise()));

            List<PieceRequise> resultat = service.listerPiecesRequises();

            assertThat(resultat).hasSize(2);
        }
    }
}