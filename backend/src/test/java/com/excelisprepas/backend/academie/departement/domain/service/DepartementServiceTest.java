package com.excelisprepas.backend.academie.departement.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.exception.DepartementAvecRosterException;
import com.excelisprepas.backend.academie.departement.domain.exception.DepartementMatiereUtiliseeException;
import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.DepartementIntrouvableException;
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
import static org.mockito.Mockito.*;

class DepartementServiceTest {

    private DepartementRepositoryPort departementRepository;
    private MatiereRepositoryPort matiereRepository;
    private AffectationDepartementaleRepositoryPort rosterRepository;
    private AffectationRepositoryPort affectationRepository;
    private ProgressionRepositoryPort progressionRepository;
    private FormationRepositoryPort formationRepository;
    private UtilisateurRepositoryPort utilisateurRepository;
    private DepartementService service;

    @BeforeEach
    void setUp() {
        departementRepository = mock(DepartementRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        rosterRepository = mock(AffectationDepartementaleRepositoryPort.class);
        affectationRepository = mock(AffectationRepositoryPort.class);
        progressionRepository = mock(ProgressionRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);

        service = new DepartementService(
                departementRepository,
                matiereRepository,
                rosterRepository,
                affectationRepository,
                progressionRepository,
                formationRepository,
                utilisateurRepository
        );
    }

    private Departement unDepartement() {
        return new Departement(UUID.randomUUID(), "Mathématiques", UUID.randomUUID());
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée un département et sa matière associée (relation 1-1) avec couleur")
        void creeUnDepartementEtSaMatiereAssocieeAvecCouleur() {
            when(matiereRepository.save(any(Matiere.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(departementRepository.save(any(Departement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Departement resultat = service.creerDepartement("Mathématiques", "Mathématiques", "#10B981");

            assertThat(resultat.getNom()).isEqualTo("Mathématiques");
            assertThat(resultat.getMatiereId()).isNotNull();
            verify(matiereRepository).save(any(Matiere.class));
            verify(departementRepository).save(any(Departement.class));
        }

        @Test
        @DisplayName("refuse la création si le nom du département est vide")
        void refuseCreationSiNomDepartementVide() {
            ThrowingCallable creation = () -> service.creerDepartement("  ", "Mathématiques");

            assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
            verify(departementRepository, never()).save(any(Departement.class));
        }

        @Test
        @DisplayName("refuse la création si le nom de la matière est vide")
        void refuseCreationSiNomMatiereVide() {
            ThrowingCallable creation = () -> service.creerDepartement("Mathématiques", "  ");

            assertThatThrownBy(creation).isInstanceOf(IllegalArgumentException.class);
            verify(matiereRepository, never()).save(any(Matiere.class));
            verify(departementRepository, never()).save(any(Departement.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererDepartement() retourne le département s'il existe")
        void recupererDepartementRetourneLeDepartement() {
            Departement departement = unDepartement();
            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));

            Departement resultat = service.recupererDepartement(departement.getId());

            assertThat(resultat).isEqualTo(departement);
        }

        @Test
        @DisplayName("recupererDepartement() lève DepartementIntrouvableException si absent")
        void recupererDepartementInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(departementRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererDepartement(id);

            assertThatThrownBy(recuperation).isInstanceOf(DepartementIntrouvableException.class);
        }

        @Test
        @DisplayName("listerDepartements() retourne tous les départements")
        void listerDepartementsRetourneTous() {
            when(departementRepository.findAll()).thenReturn(List.of(unDepartement(), unDepartement()));

            List<Departement> resultat = service.listerDepartements();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("renommerDepartement() renomme et sauvegarde")
        void renommerDepartementReussit() {
            Departement departement = unDepartement();
            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));
            when(departementRepository.save(any(Departement.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Departement resultat = service.renommerDepartement(departement.getId(), "Physique-Chimie");

            assertThat(resultat.getNom()).isEqualTo("Physique-Chimie");
        }
    }

    @Nested
    @DisplayName("Suppression et Garde-fous")
    class Suppression {

        @Test
        @DisplayName("supprimerDepartement() supprime le département et sa matière si sans dépendance")
        void supprimerDepartementReussit() {
            Departement departement = unDepartement();
            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));
            when(rosterRepository.existsByDepartementId(departement.getId())).thenReturn(false);
            when(affectationRepository.existsByMatiereId(departement.getMatiereId())).thenReturn(false);
            when(progressionRepository.existsByMatiereId(departement.getMatiereId())).thenReturn(false);
            when(formationRepository.existsByMatiereId(departement.getMatiereId())).thenReturn(false);

            service.supprimerDepartement(departement.getId());

            verify(departementRepository).deleteById(departement.getId());
            verify(matiereRepository).deleteById(departement.getMatiereId());
        }

        @Test
        @DisplayName("bloque la suppression si des enseignants sont dans le roster")
        void bloqueSuppressionSiEnseignantsDansRoster() {
            Departement departement = unDepartement();
            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));
            when(rosterRepository.existsByDepartementId(departement.getId())).thenReturn(true);

            assertThatThrownBy(() -> service.supprimerDepartement(departement.getId()))
                    .isInstanceOf(DepartementAvecRosterException.class);

            verify(departementRepository, never()).deleteById(any());
            verify(matiereRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("bloque la suppression si la matière est utilisée dans des cours")
        void bloqueSuppressionSiMatiereUtiliseeDansCours() {
            Departement departement = unDepartement();
            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));
            when(rosterRepository.existsByDepartementId(departement.getId())).thenReturn(false);
            when(affectationRepository.existsByMatiereId(departement.getMatiereId())).thenReturn(true);

            assertThatThrownBy(() -> service.supprimerDepartement(departement.getId()))
                    .isInstanceOf(DepartementMatiereUtiliseeException.class);

            verify(departementRepository, never()).deleteById(any());
            verify(matiereRepository, never()).deleteById(any());
        }

        @Test
        @DisplayName("supprimerDepartement() lève DepartementIntrouvableException si absent")
        void supprimerDepartementInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(departementRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerDepartement(id);

            assertThatThrownBy(suppression).isInstanceOf(DepartementIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Assignation du Chef de Département")
    class AssignerChef {

        @Test
        @DisplayName("assigne un utilisateur ayant le rôle CHEF_DEPARTEMENT")
        void assigneChefValide() {
            Departement departement = unDepartement();
            UUID utilisateurId = UUID.randomUUID();
            Utilisateur utilisateur = new Utilisateur(utilisateurId, "Nkeng", "Robert", "robert@excelis.cm", "hash", RoleUtilisateur.CHEF_DEPARTEMENT);

            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(utilisateur));

            service.assignerChef(departement.getId(), utilisateurId);

            assertThat(utilisateur.getDepartementId()).isEqualTo(departement.getId());
            assertThat(departement.getChefId()).isEqualTo(utilisateurId);
            verify(utilisateurRepository).save(utilisateur);
        }

        @Test
        @DisplayName("refuse d'assigner un utilisateur qui n'a pas le rôle CHEF_DEPARTEMENT")
        void refuseUtilisateurSansRoleChefDepartement() {
            Departement departement = unDepartement();
            UUID utilisateurId = UUID.randomUUID();
            Utilisateur utilisateur = new Utilisateur(utilisateurId, "Paul", "Jean", "paul@excelis.cm", "hash", RoleUtilisateur.DIRECTEUR);

            when(departementRepository.findById(departement.getId())).thenReturn(Optional.of(departement));
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(utilisateur));

            assertThatThrownBy(() -> service.assignerChef(departement.getId(), utilisateurId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("CHEF_DEPARTEMENT");
        }

        @Test
        @DisplayName("un même chef peut être assigné à un second département sans perdre le premier")
        void assigneMemeChefAUnSecondDepartement() {
            Departement departementA = unDepartement();
            Departement departementB = unDepartement();
            UUID chefId = UUID.randomUUID();
            Utilisateur chef = new Utilisateur(chefId, "Nkeng", "Robert", "robert@excelis.cm", "hash", RoleUtilisateur.CHEF_DEPARTEMENT);

            when(departementRepository.findById(departementA.getId())).thenReturn(Optional.of(departementA));
            when(utilisateurRepository.findById(chefId)).thenReturn(Optional.of(chef));
            service.assignerChef(departementA.getId(), chefId);

            assertThat(chef.getDepartementId()).isEqualTo(departementA.getId());
            assertThat(departementA.getChefId()).isEqualTo(chefId);

            // Le même chef est ensuite assigné à un second département : departementB.chefId
            // doit pointer vers lui, ET departementA.chefId (déjà positionné plus haut) ne doit
            // pas être touché - le champ legacy Utilisateur.departementId, lui, ne peut porter
            // qu'une seule valeur et reste donc figé sur le premier département (A), sans que ça
            // n'affecte la relation many-to-one réelle (Departement.chefId), seule source de
            // vérité pour "quels départements ce chef dirige".
            when(departementRepository.findById(departementB.getId())).thenReturn(Optional.of(departementB));
            service.assignerChef(departementB.getId(), chefId);

            assertThat(departementA.getChefId()).isEqualTo(chefId);
            assertThat(departementB.getChefId()).isEqualTo(chefId);
            assertThat(chef.getDepartementId()).isEqualTo(departementA.getId());
        }

        @Test
        @DisplayName("retirer un chef multi-départements d'un département ne le détache pas de son autre département")
        void retirerChefDunDepartementNeLeDetachePasDeLautre() {
            Departement departementA = unDepartement();
            Departement departementB = unDepartement();
            UUID chefId = UUID.randomUUID();
            Utilisateur chef = new Utilisateur(chefId, "Nkeng", "Robert", "robert@excelis.cm", "hash", RoleUtilisateur.CHEF_DEPARTEMENT);

            when(departementRepository.findById(departementA.getId())).thenReturn(Optional.of(departementA));
            when(utilisateurRepository.findById(chefId)).thenReturn(Optional.of(chef));
            service.assignerChef(departementA.getId(), chefId);

            when(departementRepository.findById(departementB.getId())).thenReturn(Optional.of(departementB));
            service.assignerChef(departementB.getId(), chefId);

            // On retire ce chef du département B (sans rapport avec le champ legacy, qui
            // pointe toujours vers A) : departementA doit rester intact.
            UUID nouveauChefBId = UUID.randomUUID();
            Utilisateur nouveauChefB = new Utilisateur(nouveauChefBId, "Aïcha", "Belinga", "aicha@excelis.cm", "hash", RoleUtilisateur.CHEF_DEPARTEMENT);
            when(utilisateurRepository.findById(nouveauChefBId)).thenReturn(Optional.of(nouveauChefB));

            service.assignerChef(departementB.getId(), nouveauChefBId);

            assertThat(departementB.getChefId()).isEqualTo(nouveauChefBId);
            assertThat(departementA.getChefId()).isEqualTo(chefId);
            assertThat(chef.getDepartementId()).isEqualTo(departementA.getId());
        }
    }
}