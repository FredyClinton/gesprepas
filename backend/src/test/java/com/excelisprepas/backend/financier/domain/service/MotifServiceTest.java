package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.shared.exception.MotifIntrouvableException;
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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class MotifServiceTest {

    private MotifRepositoryPort repository;
    private MotifService service;

    @BeforeEach
    void setUp() {
        repository = mock(MotifRepositoryPort.class);
        service = new MotifService(repository);
    }

    private Motif unMotif() {
        return new Motif(UUID.randomUUID(), "Frais de cours", TypeMotif.ENTREE);
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée un motif")
        void creeUnMotif() {
            when(repository.save(any(Motif.class))).thenAnswer(i -> i.getArgument(0));

            Motif resultat = service.creerMotif("Location salle", TypeMotif.SORTIE);

            assertThat(resultat.getNom()).isEqualTo("Location salle");
            assertThat(resultat.getType()).isEqualTo(TypeMotif.SORTIE);
            assertThat(resultat.isActif()).isTrue();
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("modifierMotif renomme et sauvegarde")
        void modifierMotifRenomme() {
            Motif motif = unMotif();
            when(repository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(repository.save(any(Motif.class))).thenAnswer(i -> i.getArgument(0));

            Motif resultat = service.modifierMotif(motif.getId(), "Frais de scolarité");

            assertThat(resultat.getNom()).isEqualTo("Frais de scolarité");
        }

        @Test
        @DisplayName("modifierMotif refuse si le motif n'existe pas")
        void modifierMotifRefuseSiInexistant() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.modifierMotif(id, "Nouveau nom");

            assertThatThrownBy(action).isInstanceOf(MotifIntrouvableException.class);
        }

        @Test
        @DisplayName("desactiverMotif désactive et sauvegarde")
        void desactiverMotifDesactive() {
            Motif motif = unMotif();
            when(repository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(repository.save(any(Motif.class))).thenAnswer(i -> i.getArgument(0));

            Motif resultat = service.desactiverMotif(motif.getId());

            assertThat(resultat.isActif()).isFalse();
        }

        @Test
        @DisplayName("reactiverMotif réactive et sauvegarde")
        void reactiverMotifReactive() {
            Motif motif = unMotif();
            motif.desactiver();
            when(repository.findById(motif.getId())).thenReturn(Optional.of(motif));
            when(repository.save(any(Motif.class))).thenAnswer(i -> i.getArgument(0));

            Motif resultat = service.reactiverMotif(motif.getId());

            assertThat(resultat.isActif()).isTrue();
        }
    }

    @Nested
    @DisplayName("Listage")
    class Listage {

        @Test
        @DisplayName("listerMotifs sans filtre retourne tous les motifs")
        void listerMotifsSansFiltre() {
            when(repository.findAll()).thenReturn(List.of(
                    new Motif(UUID.randomUUID(), "Frais de cours", TypeMotif.ENTREE),
                    new Motif(UUID.randomUUID(), "Location salle", TypeMotif.SORTIE)));

            List<Motif> resultat = service.listerMotifs(null);

            assertThat(resultat).hasSize(2);
        }

        @Test
        @DisplayName("listerMotifs filtre par type")
        void listerMotifsFiltreParType() {
            when(repository.findAll()).thenReturn(List.of(
                    new Motif(UUID.randomUUID(), "Frais de cours", TypeMotif.ENTREE),
                    new Motif(UUID.randomUUID(), "Location salle", TypeMotif.SORTIE)));

            List<Motif> resultat = service.listerMotifs(TypeMotif.ENTREE);

            assertThat(resultat).hasSize(1);
            assertThat(resultat.get(0).getType()).isEqualTo(TypeMotif.ENTREE);
        }
    }
}