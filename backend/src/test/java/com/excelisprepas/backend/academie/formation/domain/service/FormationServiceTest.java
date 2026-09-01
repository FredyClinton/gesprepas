package com.excelisprepas.backend.academie.formation.domain.service;

import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.exception.FormationUtiliseeException;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.shared.exception.FormationIntrouvableException;
import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class FormationServiceTest {

    private FormationRepositoryPort formationRepository;
    private MatiereRepositoryPort matiereRepository;
    private SalleRepositoryPort salleRepository;
    private AffectationRepositoryPort affectationRepository;
    private ProgressionRepositoryPort progressionRepository;
    private CentreFormationAbonnementRepositoryPort abonnementRepository;
    private FormationService service;

    @BeforeEach
    void setUp() {
        formationRepository = mock(FormationRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        salleRepository = mock(SalleRepositoryPort.class);
        affectationRepository = mock(AffectationRepositoryPort.class);
        progressionRepository = mock(ProgressionRepositoryPort.class);
        abonnementRepository = mock(CentreFormationAbonnementRepositoryPort.class);
        service = new FormationService(formationRepository, matiereRepository,
                salleRepository, affectationRepository, progressionRepository, abonnementRepository);
    }

    private Formation uneFormation() {
        return new Formation(UUID.randomUUID(), "Ingénieurs");
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée une formation permanente sans matières")
        void creeFormationSimple() {
            when(formationRepository.save(any(Formation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Formation resultat = service.creerFormation("Ingénieurs");

            assertThat(resultat.getNom()).isEqualTo("Ingénieurs");
            assertThat(resultat.getMatiereIds()).isEmpty();
            verify(formationRepository).save(any(Formation.class));
        }

        @Test
        @DisplayName("crée une formation avec catalogue de matières existantes")
        void creeFormationAvecMatieres() {
            UUID mat1 = UUID.randomUUID();
            UUID mat2 = UUID.randomUUID();
            when(matiereRepository.findById(mat1)).thenReturn(Optional.of(new Matiere(mat1, "Maths")));
            when(matiereRepository.findById(mat2)).thenReturn(Optional.of(new Matiere(mat2, "Physique")));
            when(formationRepository.save(any(Formation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Formation resultat = service.creerFormation("Ingénieurs", Set.of(mat1, mat2));

            assertThat(resultat.getNom()).isEqualTo("Ingénieurs");
            assertThat(resultat.getMatiereIds()).containsExactlyInAnyOrder(mat1, mat2);
            verify(formationRepository).save(any(Formation.class));
        }

        @Test
        @DisplayName("refuse la création si une matière n'existe pas")
        void refuseCreationSiMatiereInexistante() {
            UUID mat1 = UUID.randomUUID();
            when(matiereRepository.findById(mat1)).thenReturn(Optional.empty());

            ThrowingCallable creation = () -> service.creerFormation("Ingénieurs", Set.of(mat1));

            assertThatThrownBy(creation).isInstanceOf(MatiereIntrouvableException.class);
            verify(formationRepository, never()).save(any(Formation.class));
        }
    }

    @Nested
    @DisplayName("Gestion de la maquette pédagogique")
    class MaquettePedagogique {

        @Test
        @DisplayName("associe une matière au programme d'une formation")
        void associeMatiere() {
            Formation formation = uneFormation();
            UUID matId = UUID.randomUUID();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(matiereRepository.findById(matId)).thenReturn(Optional.of(new Matiere(matId, "Physique")));
            when(formationRepository.save(any(Formation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Formation res = service.associerMatiere(formation.getId(), matId);

            assertThat(res.contientMatiere(matId)).isTrue();
            verify(formationRepository).save(formation);
        }

        @Test
        @DisplayName("dissocie une matière si aucune progression n'y est rattachée")
        void dissocieMatiere() {
            UUID matId = UUID.randomUUID();
            Formation formation = new Formation(UUID.randomUUID(), "Ingénieurs", Set.of(matId));
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(progressionRepository.existsByFormationIdAndMatiereId(formation.getId(), matId)).thenReturn(false);
            when(formationRepository.save(any(Formation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Formation res = service.dissocierMatiere(formation.getId(), matId);

            assertThat(res.contientMatiere(matId)).isFalse();
        }

        @Test
        @DisplayName("refuse la dissociation d'une matière si des progressions existent")
        void refuseDissociationSiProgressionExiste() {
            UUID matId = UUID.randomUUID();
            Formation formation = new Formation(UUID.randomUUID(), "Ingénieurs", Set.of(matId));
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(progressionRepository.existsByFormationIdAndMatiereId(formation.getId(), matId)).thenReturn(true);

            assertThatThrownBy(() -> service.dissocierMatiere(formation.getId(), matId))
                    .isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("listerMatieres() retourne les matières au programme")
        void listerMatieres() {
            UUID matId = UUID.randomUUID();
            Formation formation = new Formation(UUID.randomUUID(), "Ingénieurs", Set.of(matId));
            Matiere matiere = new Matiere(matId, "Physique");
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(matiereRepository.findById(matId)).thenReturn(Optional.of(matiere));

            List<Matiere> matieres = service.listerMatieres(formation.getId());

            assertThat(matieres).containsExactly(matiere);
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererFormation() retourne la formation si elle existe")
        void recupererFormationRetourneLaFormation() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));

            Formation resultat = service.recupererFormation(formation.getId());

            assertThat(resultat).isEqualTo(formation);
        }

        @Test
        @DisplayName("recupererFormation() lève FormationIntrouvableException si absente")
        void recupererFormationInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(formationRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererFormation(id);

            assertThatThrownBy(recuperation).isInstanceOf(FormationIntrouvableException.class);
        }

        @Test
        @DisplayName("listerFormations() retourne toutes les formations")
        void listerFormationsRetourneToutes() {
            when(formationRepository.findAll()).thenReturn(List.of(uneFormation(), uneFormation()));

            List<Formation> resultat = service.listerFormations();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("renommerFormation() renomme et sauvegarde")
        void renommerFormationReussit() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(formationRepository.save(any(Formation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Formation resultat = service.renommerFormation(formation.getId(), "Ingénieurs Data");

            assertThat(resultat.getNom()).isEqualTo("Ingénieurs Data");
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerFormation() supprime si aucune référence ailleurs")
        void supprimerFormationSansReferenceSupprime() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(salleRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(affectationRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(progressionRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(abonnementRepository.existsByFormationId(formation.getId())).thenReturn(false);

            service.supprimerFormation(formation.getId());

            verify(formationRepository).deleteById(formation.getId());
        }

        @Test
        @DisplayName("supprimerFormation() refuse si une Salle référence encore la formation")
        void supprimerFormationAvecSalleRefuse() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(salleRepository.existsByFormationId(formation.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerFormation(formation.getId());

            assertThatThrownBy(suppression).isInstanceOf(FormationUtiliseeException.class);
            verify(formationRepository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerFormation() refuse si un Centre est encore abonné à la formation")
        void supprimerFormationAvecAbonnementRefuse() {
            Formation formation = uneFormation();
            when(formationRepository.findById(formation.getId())).thenReturn(Optional.of(formation));
            when(salleRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(affectationRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(progressionRepository.existsByFormationId(formation.getId())).thenReturn(false);
            when(abonnementRepository.existsByFormationId(formation.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerFormation(formation.getId());

            assertThatThrownBy(suppression).isInstanceOf(FormationUtiliseeException.class);
            verify(formationRepository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerFormation() lève FormationIntrouvableException si absente")
        void supprimerFormationInexistanteLeveException() {
            UUID id = UUID.randomUUID();
            when(formationRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerFormation(id);

            assertThatThrownBy(suppression).isInstanceOf(FormationIntrouvableException.class);
        }
    }
}
