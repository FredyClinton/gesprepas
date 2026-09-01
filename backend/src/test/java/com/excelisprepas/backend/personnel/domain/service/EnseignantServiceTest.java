package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.gelenseignants.domain.port.in.VerifierAutoriseGestionEnseignantsUseCase;
import com.excelisprepas.backend.personnel.domain.exception.EnseignantUtiliseException;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.FicheAncienneteEnseignant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.StatutEnseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.EnseignantIntrouvableException;
import com.excelisprepas.backend.shared.exception.GestionEnseignantsGeleeException;
import com.excelisprepas.backend.shared.exception.MatriculeDejaUtiliseException;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class EnseignantServiceTest {

    private EnseignantRepositoryPort repository;
    private AffectationRepositoryPort affectationRepository;
    private VerifierAutoriseGestionEnseignantsUseCase gel;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private AffectationDepartementaleRepositoryPort rosterRepository;
    private DepartementRepositoryPort departementRepository;
    private EnseignantService service;

    @BeforeEach
    void setUp() {
        repository = mock(EnseignantRepositoryPort.class);
        affectationRepository = mock(AffectationRepositoryPort.class);
        gel = mock(VerifierAutoriseGestionEnseignantsUseCase.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        rosterRepository = mock(AffectationDepartementaleRepositoryPort.class);
        departementRepository = mock(DepartementRepositoryPort.class);
        service = new EnseignantService(repository, affectationRepository, gel, sessionRepository, rosterRepository, departementRepository);
    }

    private Enseignant unEnseignant() {
        return new Enseignant(UUID.randomUUID(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
    }

    @Nested
    @DisplayName("Création")
    class Creation {

        @Test
        @DisplayName("crée un enseignant et le sauvegarde")
        void creeUnEnseignant() {
            when(repository.existsByMatricule(anyString())).thenReturn(false);
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.creerEnseignant(null, "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"), null, null, null, null);

            assertThat(resultat.getMatricule()).isEqualTo("MAT-001");
            verify(repository).save(any(Enseignant.class));
        }

        @Test
        @DisplayName("refuse un matricule déjà utilisé")
        void refuseMatriculeDejaUtilise() {
            when(repository.existsByMatricule(anyString())).thenReturn(true);

            ThrowingCallable creation = () ->
                    service.creerEnseignant(null, "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"), null, null, null, null);

            assertThatThrownBy(creation).isInstanceOf(MatriculeDejaUtiliseException.class);
            verify(repository, never()).save(any(Enseignant.class));
        }

        @Test
        @DisplayName("refuse si le gel de gestion des enseignants est effectif pour l'appelant")
        void refuseSiGele() {
            doThrow(new GestionEnseignantsGeleeException()).when(gel).verifierAutorise(RoleUtilisateur.CHEF_DEPARTEMENT);

            ThrowingCallable creation = () ->
                    service.creerEnseignant(RoleUtilisateur.CHEF_DEPARTEMENT, "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"), null, null, null, null);

            assertThatThrownBy(creation).isInstanceOf(GestionEnseignantsGeleeException.class);
            verify(repository, never()).save(any(Enseignant.class));
        }
    }

    @Nested
    @DisplayName("Récupération")
    class Recuperation {

        @Test
        @DisplayName("recupererEnseignant() retourne l'enseignant s'il existe")
        void recupererEnseignantRetourneLEnseignant() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));

            Enseignant resultat = service.recupererEnseignant(enseignant.getId());

            assertThat(resultat).isEqualTo(enseignant);
        }

        @Test
        @DisplayName("recupererEnseignant() lève EnseignantIntrouvableException si absent")
        void recupererEnseignantInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable recuperation = () -> service.recupererEnseignant(id);

            assertThatThrownBy(recuperation).isInstanceOf(EnseignantIntrouvableException.class);
        }

        @Test
        @DisplayName("listerEnseignants() retourne tous les enseignants")
        void listerEnseignantsRetourneTous() {
            when(repository.findAll()).thenReturn(List.of(unEnseignant(), unEnseignant()));

            List<Enseignant> resultat = service.listerEnseignants();

            assertThat(resultat).hasSize(2);
        }
    }

    @Nested
    @DisplayName("Modification")
    class Modification {

        @Test
        @DisplayName("renommerEnseignant() renomme et sauvegarde")
        void renommerEnseignantReussit() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.renommerEnseignant(null, enseignant.getId(), "Soh", "Wilson");

            assertThat(resultat.getNom()).isEqualTo("Soh");
            assertThat(resultat.getPrenom()).isEqualTo("Wilson");
        }

        @Test
        @DisplayName("modifierCoutParSeance() met à jour le coût et sauvegarde")
        void modifierCoutParSeanceReussit() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.modifierCoutParSeance(null, enseignant.getId(), new BigDecimal("6000"));

            assertThat(resultat.getCoutParSeance()).isEqualByComparingTo("6000");
        }
    }

    @Nested
    @DisplayName("Suspension")
    class Suspension {

        @Test
        @DisplayName("suspendreEnseignant() suspend et sauvegarde")
        void suspendreEnseignantReussit() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.suspendreEnseignant(null, enseignant.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutEnseignant.SUSPENDU);
        }

        @Test
        @DisplayName("suspendreEnseignant() désassigne les créneaux ASSIGNEE mais laisse les EFFECTUEE intacts")
        void suspendreEnseignantDesassigneLesCreneauxNonEffectues() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Affectation creneauAssigne = new Affectation(UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                    UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), enseignant.getId(), Jour.LUNDI, 1, 1,
                    StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantIdAndStatut(enseignant.getId(), StatutAffectation.ASSIGNEE))
                    .thenReturn(List.of(creneauAssigne));
            when(affectationRepository.save(any(Affectation.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            service.suspendreEnseignant(null, enseignant.getId());

            assertThat(creneauAssigne.getStatut()).isEqualTo(StatutAffectation.PLANIFIEE);
            assertThat(creneauAssigne.getEnseignantId()).isNull();
            verify(affectationRepository).save(creneauAssigne);
            // Les créneaux EFFECTUEE ne sont jamais interrogés ni touchés.
            verify(affectationRepository, never())
                    .findByEnseignantIdAndStatut(enseignant.getId(), StatutAffectation.EFFECTUEE);
        }

        @Test
        @DisplayName("reactiverEnseignant() réactive et sauvegarde")
        void reactiverEnseignantReussit() {
            Enseignant enseignant = unEnseignant();
            enseignant.suspendre();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(repository.save(any(Enseignant.class))).thenAnswer(invocation -> invocation.getArgument(0));

            Enseignant resultat = service.reactiverEnseignant(null, enseignant.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutEnseignant.ACTIF);
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerEnseignant() supprime si aucune affectation ne le référence")
        void supprimerEnseignantSansAffectationSupprime() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(affectationRepository.existsByEnseignantId(enseignant.getId())).thenReturn(false);

            service.supprimerEnseignant(null, enseignant.getId());

            verify(repository).deleteById(enseignant.getId());
        }

        @Test
        @DisplayName("supprimerEnseignant() refuse si une affectation le référence encore")
        void supprimerEnseignantAvecAffectationRefuse() {
            Enseignant enseignant = unEnseignant();
            when(repository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(affectationRepository.existsByEnseignantId(enseignant.getId())).thenReturn(true);

            ThrowingCallable suppression = () -> service.supprimerEnseignant(null, enseignant.getId());

            assertThatThrownBy(suppression).isInstanceOf(EnseignantUtiliseException.class);
            verify(repository, never()).deleteById(any(UUID.class));
        }

        @Test
        @DisplayName("supprimerEnseignant() lève EnseignantIntrouvableException si absent")
        void supprimerEnseignantInexistantLeveException() {
            UUID id = UUID.randomUUID();
            when(repository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable suppression = () -> service.supprimerEnseignant(null, id);

            assertThatThrownBy(suppression).isInstanceOf(EnseignantIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Ancienneté et Historique")
    class Anciennete {

        @Test
        @DisplayName("consulterAnciennete() calcule l'ancienneté et agrège l'historique des sessions")
        void calculerAncienneteEtHistorique() {
            UUID enseignantId = UUID.randomUUID();
            LocalDate dateRecrutement = LocalDate.now().minusYears(2).minusMonths(3);
            Enseignant enseignant = Enseignant.reconstituer(
                    enseignantId, "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"),
                    StatutEnseignant.ACTIF, "699000000", "CNI-123", "Univ", "Grade 1", dateRecrutement);

            when(repository.findById(enseignantId)).thenReturn(Optional.of(enseignant));

            UUID session1Id = UUID.randomUUID();
            UUID session2Id = UUID.randomUUID();
            UUID dep1Id = UUID.randomUUID();

            SessionAcademique s1 = SessionAcademique.reconstituer(
                    session1Id, "2024-2025", LocalDate.of(2024, 9, 1), LocalDate.of(2025, 6, 30), StatutSession.CLOTUREE);
            SessionAcademique s2 = SessionAcademique.reconstituer(
                    session2Id, "2025-2026", LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.EN_COURS);

            when(sessionRepository.findById(session1Id)).thenReturn(Optional.of(s1));
            when(sessionRepository.findById(session2Id)).thenReturn(Optional.of(s2));

            UUID matiereId = UUID.randomUUID();
            Departement dep1 = new Departement(dep1Id, "Mathématiques", matiereId);
            when(departementRepository.findById(dep1Id)).thenReturn(Optional.of(dep1));

            AffectationDepartementale roster1 = new AffectationDepartementale(UUID.randomUUID(), enseignantId, session1Id, dep1Id);
            AffectationDepartementale roster2 = new AffectationDepartementale(UUID.randomUUID(), enseignantId, session2Id, dep1Id);
            when(rosterRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(roster1, roster2));

            Affectation aff1 = new Affectation(
                    UUID.randomUUID(), UUID.randomUUID(), session1Id, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                    enseignantId, Jour.LUNDI, 1, 1, StatutAffectation.EFFECTUEE);
            Affectation aff2 = new Affectation(
                    UUID.randomUUID(), UUID.randomUUID(), session2Id, UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(),
                    enseignantId, Jour.MARDI, 2, 1, StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(aff1, aff2));

            FicheAncienneteEnseignant fiche = service.consulterAnciennete(enseignantId);

            assertThat(fiche.enseignantId()).isEqualTo(enseignantId);
            assertThat(fiche.nom()).isEqualTo("Ossegue");
            assertThat(fiche.prenom()).isEqualTo("Jean");
            assertThat(fiche.dateRecrutement()).isEqualTo(dateRecrutement);
            assertThat(fiche.ancienneteAnnees()).isEqualTo(2);
            assertThat(fiche.ancienneteMois()).isEqualTo(3);
            assertThat(fiche.nombreSessionsActives()).isEqualTo(2);
            assertThat(fiche.historiqueSessions()).hasSize(2);

            // Plus récente en premier (2025-2026)
            assertThat(fiche.historiqueSessions().get(0).libelleSession()).isEqualTo("2025-2026");
            assertThat(fiche.historiqueSessions().get(0).seancesEffectuees()).isEqualTo(0);
            assertThat(fiche.historiqueSessions().get(0).seancesTotales()).isEqualTo(1);
            assertThat(fiche.historiqueSessions().get(0).nomsDepartements()).containsExactly("Mathématiques");

            assertThat(fiche.historiqueSessions().get(1).libelleSession()).isEqualTo("2024-2025");
            assertThat(fiche.historiqueSessions().get(1).seancesEffectuees()).isEqualTo(1);
            assertThat(fiche.historiqueSessions().get(1).seancesTotales()).isEqualTo(1);
        }
    }
}