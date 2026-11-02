package com.excelisprepas.backend.academie.affectation.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.exception.ConflitHoraireEnseignantException;
import com.excelisprepas.backend.academie.affectation.domain.exception.EnseignantSuspenduException;
import com.excelisprepas.backend.academie.affectation.domain.exception.SeanceNonEncorePasseeException;
import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.model.Salle;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
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
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AffectationServiceTest {

    private final UUID centreId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID formationId = UUID.randomUUID();
    private final UUID salleId = UUID.randomUUID();
    private final UUID matiereId = UUID.randomUUID();

    private AffectationRepositoryPort affectationRepository;
    private CentreRepositoryPort centreRepository;
    private FormationRepositoryPort formationRepository;
    private SalleRepositoryPort salleRepository;
    private MatiereRepositoryPort matiereRepository;
    private EnseignantRepositoryPort enseignantRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private DepartementRepositoryPort departementRepository;
    private AffectationDepartementaleRepositoryPort rosterRepository;
    private AffectationService service;

    @BeforeEach
    void setUp() {
        affectationRepository = mock(AffectationRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        formationRepository = mock(FormationRepositoryPort.class);
        salleRepository = mock(SalleRepositoryPort.class);
        matiereRepository = mock(MatiereRepositoryPort.class);
        enseignantRepository = mock(EnseignantRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        departementRepository = mock(DepartementRepositoryPort.class);
        rosterRepository = mock(AffectationDepartementaleRepositoryPort.class);
        service = new AffectationService(affectationRepository, centreRepository, formationRepository,
                salleRepository, matiereRepository, enseignantRepository, sessionRepository,
                departementRepository, rosterRepository);
    }

    // La formation est toujours construite avec `sessionId` (le champ de classe) :
    private void stubToutExiste() {
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
        when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                new Formation(formationId, "Ingénieurs", java.util.Set.of(matiereId))));
        when(salleRepository.findById(salleId)).thenReturn(Optional.of(
                new Salle(salleId, "SALLE ING 1", centreId, sessionId, formationId, UUID.randomUUID())));
        when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                new Matiere(matiereId, "Mathématiques")));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                SessionAcademique.reconstituer(sessionId, "2026-2027",
                        LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));
    }

    @Nested
    @DisplayName("Création de créneau")
    class CreationCreneau {

        @Test
        @DisplayName("crée un créneau quand toutes les entités existent, la session est ouverte et la matière est au programme")
        void creerCreneauQuandToutEstValide() {
            // Given
            stubToutExiste();
            when(affectationRepository.existsBySalleIdAndJourAndSemaineAndSeance(
                    salleId, Jour.LUNDI, 1, 1)).thenReturn(false);
            when(affectationRepository.save(any(Affectation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Affectation resultat = service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId,
                    Jour.LUNDI, 1, 1);

            // Then
            assertThat(resultat.getCentreId()).isEqualTo(centreId);
            assertThat(resultat.getSessionId()).isEqualTo(sessionId);
            assertThat(resultat.getFormationId()).isEqualTo(formationId);
            assertThat(resultat.getSalleId()).isEqualTo(salleId);
            assertThat(resultat.getMatiereId()).isEqualTo(matiereId);
            assertThat(resultat.getEnseignantId()).isNull();
            assertThat(resultat.getJour()).isEqualTo(Jour.LUNDI);
            assertThat(resultat.getSeance()).isEqualTo(1);
            assertThat(resultat.getSemaine()).isEqualTo(1);
            assertThat(resultat.getStatut()).isEqualTo(StatutAffectation.PLANIFIEE);
            verify(affectationRepository).save(any(Affectation.class));
        }

        @Test
        @DisplayName("initialise l'affectation au statut PLANIFIEE avec enseignantId null")
        void initialiseAuStatutPlanifieeSansEnseignant() {
            // Given
            stubToutExiste();
            when(affectationRepository.existsBySalleIdAndJourAndSemaineAndSeance(
                    salleId, Jour.LUNDI, 1, 1)).thenReturn(false);
            when(affectationRepository.save(any(Affectation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Affectation resultat = service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId,
                    Jour.LUNDI, 1, 1);

            // Then
            assertThat(resultat.getStatut()).isEqualTo(StatutAffectation.PLANIFIEE);
            assertThat(resultat.getEnseignantId()).isNull();
        }

        @Test
        @DisplayName("refuse la création si le centre n'existe pas")
        void refuseCreationSiCentreInexistant() {
            // Given
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable creation = () ->
                    service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);

            // Then
            assertThatThrownBy(creation).isInstanceOf(CentreIntrouvableException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }

        @Test
        @DisplayName("refuse la création si le centre est fermé")
        void refuseCreationSiCentreFerme() {
            // Given
            Centre centre = new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé");
            centre.fermer();
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(centre));

            // When
            ThrowingCallable creation = () ->
                    service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);

            // Then
            assertThatThrownBy(creation).isInstanceOf(CentreFermeException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }

        @Test
        @DisplayName("refuse la création si la formation n'existe pas")
        void refuseCreationSiFormationInexistante() {
            // Given
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable creation = () ->
                    service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);

            // Then
            assertThatThrownBy(creation).isInstanceOf(FormationIntrouvableException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }

        @Test
        @DisplayName("refuse la création si la salle n'existe pas")
        void refuseCreationSiSalleInexistante() {
            // Given
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs", java.util.Set.of(matiereId))));
            when(salleRepository.findById(salleId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable creation = () ->
                    service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);

            // Then
            assertThatThrownBy(creation).isInstanceOf(SalleIntrouvableException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }

        @Test
        @DisplayName("refuse la création si la matière n'existe pas")
        void refuseCreationSiMatiereInexistante() {
            // Given
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs", java.util.Set.of(matiereId))));
            when(salleRepository.findById(salleId)).thenReturn(Optional.of(
                    new Salle(salleId, "SALLE ING 1", centreId, sessionId, formationId, UUID.randomUUID())));
            when(matiereRepository.findById(matiereId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable creation = () ->
                    service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);

            // Then
            assertThatThrownBy(creation).isInstanceOf(MatiereIntrouvableException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }

        @Test
        @DisplayName("refuse la création si la session n'existe pas")
        void refuseCreationSiSessionIntrouvable() {
            // Given
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs", java.util.Set.of(matiereId))));
            when(salleRepository.findById(salleId)).thenReturn(Optional.of(
                    new Salle(salleId, "SALLE ING 1", centreId, sessionId, formationId, UUID.randomUUID())));
            when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                    new Matiere(matiereId, "Mathématiques")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable creation = () ->
                    service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);

            // Then
            assertThatThrownBy(creation).isInstanceOf(SessionIntrouvableException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }

        @Test
        @DisplayName("refuse la création si la session est clôturée")
        void refuseCreationSiSessionCloturee() {
            // Given
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs", java.util.Set.of(matiereId))));
            when(salleRepository.findById(salleId)).thenReturn(Optional.of(
                    new Salle(salleId, "SALLE ING 1", centreId, sessionId, formationId, UUID.randomUUID())));
            when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                    new Matiere(matiereId, "Mathématiques")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            // When
            ThrowingCallable creation = () ->
                    service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);

            // Then
            assertThatThrownBy(creation).isInstanceOf(SessionNonUtilisableException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }

        @Test
        @DisplayName("refuse la création si la matière n'est pas au programme de la formation")
        void refuseCreationSiMatiereNonAuProgramme() {
            // Given
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre A", "Avenue Kennedy", "Yaoundé")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Ingénieurs", java.util.Set.of())));
            when(salleRepository.findById(salleId)).thenReturn(Optional.of(
                    new Salle(salleId, "SALLE ING 1", centreId, sessionId, formationId, UUID.randomUUID())));
            when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                    new Matiere(matiereId, "Mathématiques")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2026-2027",
                            LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS)));

            // When
            ThrowingCallable creation = () ->
                    service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);

            // Then
            assertThatThrownBy(creation).isInstanceOf(MatiereNonAuProgrammeException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }
    }

    @Test
    @DisplayName("refuse la création si le créneau (salle+semaine+séance) est déjà pris")
    void refuseCreationSiCreneauDejaPris() {
        // Given
        stubToutExiste();
        when(affectationRepository.existsBySalleIdAndJourAndSemaineAndSeance(salleId, Jour.LUNDI, 1, 1)).thenReturn(true);

        // When
        ThrowingCallable creation = () -> service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);

        // Then
        assertThatThrownBy(creation).isInstanceOf(CreneauDejaPlanifieException.class);
        verify(affectationRepository, never()).save(any(Affectation.class));
    }

    @Test
    @DisplayName("autorise deux créneaux avec la même salle/semaine/séance sur des jours différents")
    void autoriseMemeSalleSemaineSeanceSurJoursDifferents() {
        // Given
        stubToutExiste();
        when(affectationRepository.existsBySalleIdAndJourAndSemaineAndSeance(salleId, Jour.LUNDI, 1, 1)).thenReturn(false);
        when(affectationRepository.existsBySalleIdAndJourAndSemaineAndSeance(salleId, Jour.MARDI, 1, 1)).thenReturn(false);
        when(affectationRepository.save(any(Affectation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // When
        Affectation creneauLundi = service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.LUNDI, 1, 1);
        Affectation creneauMardi = service.creerCreneau(centreId, sessionId, formationId, salleId, matiereId, Jour.MARDI, 1, 1);

        // Then
        assertThat(creneauLundi.getJour()).isEqualTo(Jour.LUNDI);
        assertThat(creneauMardi.getJour()).isEqualTo(Jour.MARDI);
        verify(affectationRepository, times(2)).save(any(Affectation.class));
    }

    @Test
    @DisplayName("refuse si aucun département n'est rattaché à la matière du créneau")
    void refuseSiAucunDepartementRattacheALaMatiere() {
        // Given
        Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
        Enseignant enseignant = new Enseignant(UUID.randomUUID(), "Ossegue", "Jean", "MAT-001",
                new BigDecimal("5000"));
        when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
        when(enseignantRepository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
        when(departementRepository.findByMatiereId(matiereId)).thenReturn(Optional.empty());

        // When
        ThrowingCallable assignation = () -> service.assignerEnseignant(affectation.getId(), enseignant.getId());

        // Then
        assertThatThrownBy(assignation).isInstanceOf(MatiereNonRattacheeDepartementException.class);
        verify(affectationRepository, never()).save(any(Affectation.class));
    }

    @Test
    @DisplayName("refuse si l'enseignant ne fait pas partie du roster du département pour cette session")
    void refuseSiEnseignantNonDansLeRoster() {
        // Given
        Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
        Enseignant enseignant = new Enseignant(UUID.randomUUID(), "Ossegue", "Jean", "MAT-001",
                new BigDecimal("5000"));
        Departement departement = new Departement(UUID.randomUUID(), "Sciences Physiques", matiereId);
        when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
        when(enseignantRepository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
        when(departementRepository.findByMatiereId(matiereId)).thenReturn(Optional.of(departement));
        when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(
                enseignant.getId(), sessionId, departement.getId())).thenReturn(false);

        // When
        ThrowingCallable assignation = () -> service.assignerEnseignant(affectation.getId(), enseignant.getId());

        // Then
        assertThatThrownBy(assignation).isInstanceOf(EnseignantNonRattacheDepartementException.class);
        verify(affectationRepository, never()).save(any(Affectation.class));
    }

    @Nested
    @DisplayName("Assignation d'enseignant")
    class AssignationEnseignant {

        @Test
        @DisplayName("assigne l'enseignant quand l'affectation existe et l'enseignant est actif")
        void assigneEnseignantReussit() {
            // Given
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
            Enseignant enseignant = new Enseignant(UUID.randomUUID(), "Ossegue", "Jean", "MAT-001",
                    new BigDecimal("5000"));
            Departement departement = new Departement(UUID.randomUUID(), "Sciences Physiques", matiereId);
            when(departementRepository.findByMatiereId(matiereId)).thenReturn(Optional.of(departement));
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(
                    enseignant.getId(), affectation.getSessionId(), departement.getId())).thenReturn(true);
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            when(enseignantRepository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));
            when(affectationRepository.save(any(Affectation.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            Affectation resultat = service.assignerEnseignant(affectation.getId(), enseignant.getId());

            // Then
            assertThat(resultat.getEnseignantId()).isEqualTo(enseignant.getId());
            assertThat(resultat.getStatut()).isEqualTo(StatutAffectation.ASSIGNEE);
        }

        @Test
        @DisplayName("refuse si l'affectation n'existe pas")
        void refuseSiAffectationInexistante() {
            // Given
            UUID affectationId = UUID.randomUUID();
            when(affectationRepository.findById(affectationId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable assignation = () -> service.assignerEnseignant(affectationId, UUID.randomUUID());

            // Then
            assertThatThrownBy(assignation).isInstanceOf(AffectationIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si l'enseignant n'existe pas")
        void refuseSiEnseignantInexistant() {
            // Given
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
            UUID enseignantId = UUID.randomUUID();
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            when(enseignantRepository.findById(enseignantId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable assignation = () -> service.assignerEnseignant(affectation.getId(), enseignantId);

            // Then
            assertThatThrownBy(assignation).isInstanceOf(EnseignantIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si l'enseignant est suspendu")
        void refuseSiEnseignantSuspendu() {
            // Given
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
            Enseignant enseignant = new Enseignant(UUID.randomUUID(), "Ossegue", "Jean", "MAT-001",
                    new BigDecimal("5000"));
            enseignant.suspendre();
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            when(enseignantRepository.findById(enseignant.getId())).thenReturn(Optional.of(enseignant));

            // When
            ThrowingCallable assignation = () -> service.assignerEnseignant(affectation.getId(), enseignant.getId());

            // Then
            assertThatThrownBy(assignation).isInstanceOf(EnseignantSuspenduException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }
    }

    @Nested
    @DisplayName("Contrôle des conflits d'emploi du temps des enseignants")
    class ConflitsHorairesEnseignants {

        private UUID enseignantId;
        private Enseignant enseignant;
        private Departement departement;
        private LocalDate dateLundi;

        @BeforeEach
        void setupConflits() {
            enseignantId = UUID.randomUUID();
            enseignant = new Enseignant(enseignantId, "Kamga", "Paul", "ENS-042", new BigDecimal("6000"));
            departement = new Departement(UUID.randomUUID(), "Mathématiques", matiereId);
            dateLundi = LocalDate.of(2026, 11, 2); // Un lundi

            when(enseignantRepository.findByIdWithLock(enseignantId)).thenReturn(Optional.of(enseignant));
            when(enseignantRepository.findById(enseignantId)).thenReturn(Optional.of(enseignant));
            when(departementRepository.findByMatiereId(matiereId)).thenReturn(Optional.of(departement));
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(
                    enseignantId, sessionId, departement.getId())).thenReturn(true);
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(
                    new Centre(centreId, "Centre B", "Akwa", "Douala")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(
                    new Formation(formationId, "Terminale C", java.util.Set.of(matiereId))));
            when(matiereRepository.findById(matiereId)).thenReturn(Optional.of(
                    new Matiere(matiereId, "Mathématiques")));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2026-2027",
                            dateLundi, dateLundi.plusMonths(9), StatutSession.EN_COURS)));
            when(affectationRepository.save(any(Affectation.class))).thenAnswer(i -> i.getArgument(0));
        }

        private Affectation creerAffectationExistante(UUID affCentreId, UUID affFormationId, LocalDate date, LocalTime debut, LocalTime fin, StatutAffectation statut) {
            return Affectation.reconstituer(
                    UUID.randomUUID(), affCentreId, sessionId, affFormationId,
                    salleId, matiereId, enseignantId, Jour.LUNDI, 1, 1, statut,
                    null, null, null, date, debut, fin
            );
        }

        @Test
        @DisplayName("1. Deux séances exactement identiques déclenchent un conflit")
        void deuxSeancesExactementIdentiques_declencheConflit() {
            Affectation existante = creerAffectationExistante(centreId, formationId, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(existante));

            Affectation nouvelle = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(8, 0), LocalTime.of(10, 0));
            when(affectationRepository.findById(nouvelle.getId())).thenReturn(Optional.of(nouvelle));

            assertThatThrownBy(() -> service.assignerEnseignant(nouvelle.getId(), enseignantId, LocalTime.of(8, 0), LocalTime.of(10, 0)))
                    .isInstanceOf(ConflitHoraireEnseignantException.class)
                    .hasMessageContaining("Impossible d'affecter cet enseignant : il est déjà programmé le 02/11/2026 de 08h00 à 10h00 au centre Centre B, classe Terminale C");
        }

        @Test
        @DisplayName("2a. Chevauchement partiel au début (07h00 - 08h30 vs 08h00 - 10h00)")
        void chevauchementPartielDebut_declencheConflit() {
            Affectation existante = creerAffectationExistante(centreId, formationId, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(existante));

            Affectation nouvelle = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(7, 0), LocalTime.of(8, 30));
            when(affectationRepository.findById(nouvelle.getId())).thenReturn(Optional.of(nouvelle));

            assertThatThrownBy(() -> service.assignerEnseignant(nouvelle.getId(), enseignantId, LocalTime.of(7, 0), LocalTime.of(8, 30)))
                    .isInstanceOf(ConflitHoraireEnseignantException.class);
        }

        @Test
        @DisplayName("2b. Chevauchement partiel à la fin (08h30 - 10h30 vs 08h00 - 10h00)")
        void chevauchementPartielFin_declencheConflit() {
            Affectation existante = creerAffectationExistante(centreId, formationId, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(existante));

            Affectation nouvelle = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(8, 30), LocalTime.of(10, 30));
            when(affectationRepository.findById(nouvelle.getId())).thenReturn(Optional.of(nouvelle));

            assertThatThrownBy(() -> service.assignerEnseignant(nouvelle.getId(), enseignantId, LocalTime.of(8, 30), LocalTime.of(10, 30)))
                    .isInstanceOf(ConflitHoraireEnseignantException.class);
        }

        @Test
        @DisplayName("3a. Séance entièrement incluse (08h15 - 09h45 vs 08h00 - 10h00)")
        void seanceEntierementIncluse_declencheConflit() {
            Affectation existante = creerAffectationExistante(centreId, formationId, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(existante));

            Affectation nouvelle = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(8, 15), LocalTime.of(9, 45));
            when(affectationRepository.findById(nouvelle.getId())).thenReturn(Optional.of(nouvelle));

            assertThatThrownBy(() -> service.assignerEnseignant(nouvelle.getId(), enseignantId, LocalTime.of(8, 15), LocalTime.of(9, 45)))
                    .isInstanceOf(ConflitHoraireEnseignantException.class);
        }

        @Test
        @DisplayName("3b. Séance englobante (07h30 - 10h30 vs 08h00 - 10h00)")
        void seanceEnglobante_declencheConflit() {
            Affectation existante = creerAffectationExistante(centreId, formationId, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(existante));

            Affectation nouvelle = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(7, 30), LocalTime.of(10, 30));
            when(affectationRepository.findById(nouvelle.getId())).thenReturn(Optional.of(nouvelle));

            assertThatThrownBy(() -> service.assignerEnseignant(nouvelle.getId(), enseignantId, LocalTime.of(7, 30), LocalTime.of(10, 30)))
                    .isInstanceOf(ConflitHoraireEnseignantException.class);
        }

        @Test
        @DisplayName("4. Deux séances consécutives sans chevauchement sont autorisées (10h00 - 12h00 après 08h00 - 10h00)")
        void deuxSeancesConsecutives_sansChevauchement_autorise() {
            Affectation existante = creerAffectationExistante(centreId, formationId, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(existante));

            // Séance suivante débutant à l'heure exacte de fin de la précédente : 10h00 à 12h00
            Affectation nouvelleSuivante = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 2, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(10, 0), LocalTime.of(12, 0));
            when(affectationRepository.findById(nouvelleSuivante.getId())).thenReturn(Optional.of(nouvelleSuivante));

            Affectation resultatSuivant = service.assignerEnseignant(nouvelleSuivante.getId(), enseignantId, LocalTime.of(10, 0), LocalTime.of(12, 0));
            assertThat(resultatSuivant.getEnseignantId()).isEqualTo(enseignantId);

            // Séance précédente se terminant à l'heure exacte de début : 06h00 à 08h00
            Affectation nouvellePrecedente = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(6, 0), LocalTime.of(8, 0));
            when(affectationRepository.findById(nouvellePrecedente.getId())).thenReturn(Optional.of(nouvellePrecedente));

            Affectation resultatPrecedent = service.assignerEnseignant(nouvellePrecedente.getId(), enseignantId, LocalTime.of(6, 0), LocalTime.of(8, 0));
            assertThat(resultatPrecedent.getEnseignantId()).isEqualTo(enseignantId);
        }

        @Test
        @DisplayName("5. Deux séances le même jour dans deux centres différents déclenchent un conflit")
        void memeJourDeuxCentresDifferents_declencheConflit() {
            UUID centreA = UUID.randomUUID();
            UUID formationTerminaleC = UUID.randomUUID();
            when(centreRepository.findById(centreA)).thenReturn(Optional.of(new Centre(centreA, "Centre A", "Rue 1", "Yaoundé")));
            when(formationRepository.findById(formationTerminaleC)).thenReturn(Optional.of(new Formation(formationTerminaleC, "Terminale C", java.util.Set.of(matiereId))));

            Affectation existanteCentreA = creerAffectationExistante(centreA, formationTerminaleC, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(existanteCentreA));

            // Tentative d'affectation au Centre B de 08h30 à 10h30
            Affectation nouvelleCentreB = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(8, 30), LocalTime.of(10, 30));
            when(affectationRepository.findById(nouvelleCentreB.getId())).thenReturn(Optional.of(nouvelleCentreB));

            assertThatThrownBy(() -> service.assignerEnseignant(nouvelleCentreB.getId(), enseignantId, LocalTime.of(8, 30), LocalTime.of(10, 30)))
                    .isInstanceOf(ConflitHoraireEnseignantException.class)
                    .hasMessageContaining("Centre A")
                    .hasMessageContaining("Terminale C");
        }

        @Test
        @DisplayName("6. Deux séances à des dates différentes sont autorisées même avec des horaires identiques")
        void datesDifferentes_memeHoraires_autorise() {
            Affectation existanteLundi = creerAffectationExistante(centreId, formationId, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(existanteLundi));

            // Nouvelle séance le mardi (date différente) avec les mêmes horaires (08h00 - 10h00)
            LocalDate dateMardi = dateLundi.plusDays(1);
            Affectation nouvelleMardi = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.MARDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateMardi, LocalTime.of(8, 0), LocalTime.of(10, 0));
            when(affectationRepository.findById(nouvelleMardi.getId())).thenReturn(Optional.of(nouvelleMardi));

            Affectation resultat = service.assignerEnseignant(nouvelleMardi.getId(), enseignantId, LocalTime.of(8, 0), LocalTime.of(10, 0));
            assertThat(resultat.getEnseignantId()).isEqualTo(enseignantId);
        }

        @Test
        @DisplayName("7. La modification d'une séance existante exclut la séance actuellement modifiée")
        void modificationSeanceExistante_exclutSeanceCourante() {
            Affectation seanceCourante = creerAffectationExistante(centreId, formationId, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ASSIGNEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(seanceCourante));
            when(affectationRepository.findById(seanceCourante.getId())).thenReturn(Optional.of(seanceCourante));

            // Réassignation du même enseignant sur la même séance (mise à jour)
            Affectation resultat = service.assignerEnseignant(seanceCourante.getId(), enseignantId, LocalTime.of(8, 0), LocalTime.of(10, 0));
            assertThat(resultat.getId()).isEqualTo(seanceCourante.getId());
        }

        @Test
        @DisplayName("8. Le changement d'enseignant vérifie l'emploi du temps du nouvel enseignant")
        void changementEnseignant_valideEmploiDuTempsNouvelEnseignant() {
            UUID enseignant2Id = UUID.randomUUID();
            Enseignant enseignant2 = new Enseignant(enseignant2Id, "Ngo", "Marie", "ENS-099", new BigDecimal("5500"));
            when(enseignantRepository.findByIdWithLock(enseignant2Id)).thenReturn(Optional.of(enseignant2));
            when(enseignantRepository.findById(enseignant2Id)).thenReturn(Optional.of(enseignant2));
            when(rosterRepository.existsByEnseignantIdAndSessionIdAndDepartementId(
                    enseignant2Id, sessionId, departement.getId())).thenReturn(true);

            // Enseignant 2 a déjà un cours le lundi de 09h00 à 11h00
            Affectation seanceOccupéeEns2 = Affectation.reconstituer(
                    UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, enseignant2Id, Jour.LUNDI, 2, 1, StatutAffectation.ASSIGNEE,
                    null, null, null, dateLundi, LocalTime.of(9, 0), LocalTime.of(11, 0)
            );
            when(affectationRepository.findByEnseignantId(enseignant2Id)).thenReturn(List.of(seanceOccupéeEns2));

            // On tente d'assigner Enseignant 2 sur une séance qui a lieu de 08h00 à 10h00
            Affectation creneau = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, enseignantId, Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE,
                    dateLundi, LocalTime.of(8, 0), LocalTime.of(10, 0));
            when(affectationRepository.findById(creneau.getId())).thenReturn(Optional.of(creneau));

            assertThatThrownBy(() -> service.assignerEnseignant(creneau.getId(), enseignant2Id, LocalTime.of(8, 0), LocalTime.of(10, 0)))
                    .isInstanceOf(ConflitHoraireEnseignantException.class);
        }

        @Test
        @DisplayName("9. Vérifie l'acquisition du verrou pessimiste pour la protection contre les accès concurrents")
        void protectionAccesConcurrents_verifieVerrouPessimiste() {
            Affectation nouvelle = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(8, 0), LocalTime.of(10, 0));
            when(affectationRepository.findById(nouvelle.getId())).thenReturn(Optional.of(nouvelle));
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of());

            service.assignerEnseignant(nouvelle.getId(), enseignantId);

            // Vérifie que findByIdWithLock a été appelé pour sérialiser les transactions concurrentes
            verify(enseignantRepository).findByIdWithLock(enseignantId);
        }

        @Test
        @DisplayName("10. Les séances annulées sont ignorées dans la détection des conflits")
        void seancesAnnulees_ignorees() {
            Affectation annulee = creerAffectationExistante(centreId, formationId, dateLundi,
                    LocalTime.of(8, 0), LocalTime.of(10, 0), StatutAffectation.ANNULEE);
            when(affectationRepository.findByEnseignantId(enseignantId)).thenReturn(List.of(annulee));

            Affectation nouvelle = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(8, 0), LocalTime.of(10, 0));
            when(affectationRepository.findById(nouvelle.getId())).thenReturn(Optional.of(nouvelle));

            Affectation resultat = service.assignerEnseignant(nouvelle.getId(), enseignantId, LocalTime.of(8, 0), LocalTime.of(10, 0));
            assertThat(resultat.getEnseignantId()).isEqualTo(enseignantId);
        }

        @Test
        @DisplayName("11. Refuse si l'heure de fin n'est pas strictement postérieure à l'heure de début")
        void heureFinNonStrictementPosterieure_refuse() {
            Affectation nouvelle = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE,
                    dateLundi, LocalTime.of(10, 0), LocalTime.of(12, 0));
            when(affectationRepository.findById(nouvelle.getId())).thenReturn(Optional.of(nouvelle));

            // fin == debut
            assertThatThrownBy(() -> service.assignerEnseignant(nouvelle.getId(), enseignantId, LocalTime.of(10, 0), LocalTime.of(10, 0)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("doit être strictement postérieure");

            // fin < debut
            assertThatThrownBy(() -> service.assignerEnseignant(nouvelle.getId(), enseignantId, LocalTime.of(11, 0), LocalTime.of(10, 0)))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("doit être strictement postérieure");
        }
    }

    @Nested
    @DisplayName("Cycle de vie")
    class CycleDeVie {

        @Test
        @DisplayName("marquerEffectuee() réussit depuis ASSIGNEE quand la séance est déjà passée")
        void marquerEffectueeReussit() {
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, UUID.randomUUID(), Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE);
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            // semaine=1, jour=LUNDI -> date de la séance = dateDebut, ici dans le passé.
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6), StatutSession.EN_COURS)));
            when(affectationRepository.save(any(Affectation.class))).thenAnswer(i -> i.getArgument(0));

            Affectation resultat = service.marquerEffectuee(affectation.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutAffectation.EFFECTUEE);
        }

        @Test
        @DisplayName("marquerEffectuee() réussit depuis ASSIGNEE quand la séance a lieu aujourd'hui")
        void marquerEffectueeReussitLeJourMeme() {
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, UUID.randomUUID(), Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE);
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            // semaine=1, jour=LUNDI -> date de la séance = dateDebut = aujourd'hui.
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.now(), LocalDate.now().plusMonths(6), StatutSession.EN_COURS)));
            when(affectationRepository.save(any(Affectation.class))).thenAnswer(i -> i.getArgument(0));

            Affectation resultat = service.marquerEffectuee(affectation.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutAffectation.EFFECTUEE);
        }

        @Test
        @DisplayName("marquerEffectuee() échoue depuis PLANIFIEE")
        void marquerEffectueeEchoueDepuisPlanifiee() {
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.now().minusDays(10), LocalDate.now().plusMonths(6), StatutSession.EN_COURS)));

            ThrowingCallable action = () -> service.marquerEffectuee(affectation.getId());

            assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
        }

        @Test
        @DisplayName("marquerEffectuee() échoue si la séance n'a pas encore eu lieu")
        void marquerEffectueeEchoueSiSeanceFuture() {
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, UUID.randomUUID(), Jour.MARDI, 1, 1, StatutAffectation.ASSIGNEE);
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            // semaine=1, jour=MARDI -> date de la séance = dateDebut + 1 jour. dateDebut =
            // aujourd'hui, donc la séance (demain) n'est pas encore passée.
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.now(), LocalDate.now().plusMonths(6), StatutSession.EN_COURS)));

            ThrowingCallable action = () -> service.marquerEffectuee(affectation.getId());

            assertThatThrownBy(action).isInstanceOf(SeanceNonEncorePasseeException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }

        @Test
        @DisplayName("annulerAffectation() réussit depuis PLANIFIEE")
        void annulerReussit() {
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            when(affectationRepository.save(any(Affectation.class))).thenAnswer(i -> i.getArgument(0));

            Affectation resultat = service.annulerAffectation(affectation.getId());

            assertThat(resultat.getStatut()).isEqualTo(StatutAffectation.ANNULEE);
        }

        @Test
        @DisplayName("annulerAffectation() échoue depuis EFFECTUEE")
        void annulerEchoueDepuisEffectuee() {
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, UUID.randomUUID(), Jour.LUNDI, 1, 1, StatutAffectation.EFFECTUEE);
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));

            ThrowingCallable action = () -> service.annulerAffectation(affectation.getId());

            assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Modification de la matière")
    class ModificationMatiere {

        @Test
        @DisplayName("modifierMatiere() réussit et sauvegarde la nouvelle matière")
        void modifierMatiereReussit() {
            // Given
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, UUID.randomUUID(), Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE);
            UUID nouvelleMatiereId = UUID.randomUUID();
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            when(matiereRepository.findById(nouvelleMatiereId)).thenReturn(Optional.of(new Matiere(nouvelleMatiereId, "Physique")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(new Formation(formationId, "Ingénieurs", java.util.Set.of(matiereId, nouvelleMatiereId))));
            when(affectationRepository.save(any(Affectation.class))).thenAnswer(i -> i.getArgument(0));

            // When
            Affectation resultat = service.modifierMatiere(affectation.getId(), nouvelleMatiereId);

            // Then
            assertThat(resultat.getMatiereId()).isEqualTo(nouvelleMatiereId);
            assertThat(resultat.getEnseignantId()).isNull();
            assertThat(resultat.getStatut()).isEqualTo(StatutAffectation.PLANIFIEE);
            verify(affectationRepository).save(affectation);
        }

        @Test
        @DisplayName("modifierMatiere() refuse si la nouvelle matière n'existe pas")
        void modifierMatiereRefuseSiMatiereInexistante() {
            // Given
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
            UUID nouvelleMatiereId = UUID.randomUUID();
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            when(matiereRepository.findById(nouvelleMatiereId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable action = () -> service.modifierMatiere(affectation.getId(), nouvelleMatiereId);

            // Then
            assertThatThrownBy(action).isInstanceOf(MatiereIntrouvableException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }

        @Test
        @DisplayName("modifierMatiere() refuse si la nouvelle matière n'est pas au programme de la formation")
        void modifierMatiereRefuseSiNonAuProgramme() {
            // Given
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
            UUID nouvelleMatiereId = UUID.randomUUID();
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));
            when(matiereRepository.findById(nouvelleMatiereId)).thenReturn(Optional.of(new Matiere(nouvelleMatiereId, "Physique")));
            when(formationRepository.findById(formationId)).thenReturn(Optional.of(new Formation(formationId, "Ingénieurs", java.util.Set.of(matiereId))));

            // When
            ThrowingCallable action = () -> service.modifierMatiere(affectation.getId(), nouvelleMatiereId);

            // Then
            assertThatThrownBy(action).isInstanceOf(MatiereNonAuProgrammeException.class);
            verify(affectationRepository, never()).save(any(Affectation.class));
        }
    }

    @Nested
    @DisplayName("Suppression")
    class Suppression {

        @Test
        @DisplayName("supprimerAffectation() réussit et supprime le créneau")
        void supprimerAffectationReussit() {
            // Given
            Affectation affectation = new Affectation(UUID.randomUUID(), centreId, sessionId, formationId,
                    salleId, matiereId, null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE);
            when(affectationRepository.findById(affectation.getId())).thenReturn(Optional.of(affectation));

            // When
            service.supprimerAffectation(affectation.getId());

            // Then
            verify(affectationRepository).deleteById(affectation.getId());
        }

        @Test
        @DisplayName("supprimerAffectation() refuse si le créneau n'existe pas")
        void supprimerAffectationRefuseSiInexistant() {
            // Given
            UUID affectationId = UUID.randomUUID();
            when(affectationRepository.findById(affectationId)).thenReturn(Optional.empty());

            // When
            ThrowingCallable action = () -> service.supprimerAffectation(affectationId);

            // Then
            assertThatThrownBy(action).isInstanceOf(AffectationIntrouvableException.class);
            verify(affectationRepository, never()).deleteById(any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Listage")
    class Listage {

        @Test
        @DisplayName("liste les affectations d'un centre pour une session et une semaine données")
        void listeParCentreEtSemaine() {
            // Given
            List<Affectation> attendu = List.of(new Affectation(UUID.randomUUID(), centreId, sessionId,
                    formationId, salleId, matiereId, null, Jour.LUNDI, 1, 3, StatutAffectation.PLANIFIEE));
            when(affectationRepository.findBySessionIdAndCentreIdAndSemaine(sessionId, centreId, 3)).thenReturn(attendu);

            // When
            List<Affectation> resultat = service.listerAffectations(sessionId, centreId, null, 3);

            // Then
            assertThat(resultat).isEqualTo(attendu);
            verify(affectationRepository).findBySessionIdAndCentreIdAndSemaine(sessionId, centreId, 3);
        }

        @Test
        @DisplayName("liste les affectations de tous les centres pour une session et une semaine données, sans filtre")
        void listeToutesLesAffectationsDeLaSemaine() {
            // Given
            List<Affectation> attendu = List.of(new Affectation(UUID.randomUUID(), centreId, sessionId,
                    formationId, salleId, matiereId, null, Jour.LUNDI, 1, 3, StatutAffectation.PLANIFIEE));
            when(affectationRepository.findBySessionIdAndSemaine(sessionId, 3)).thenReturn(attendu);

            // When
            List<Affectation> resultat = service.listerAffectations(sessionId, null, null, 3);

            // Then
            assertThat(resultat).isEqualTo(attendu);
            verify(affectationRepository).findBySessionIdAndSemaine(sessionId, 3);
        }

        @Test
        @DisplayName("liste les affectations d'une matière (département) dans tous les centres, pour une session et une semaine données")
        void listeParMatiereToutCentreConfondu() {
            // Given
            List<Affectation> attendu = List.of(new Affectation(UUID.randomUUID(), centreId, sessionId,
                    formationId, salleId, matiereId, null, Jour.LUNDI, 1, 3, StatutAffectation.PLANIFIEE));
            when(affectationRepository.findBySessionIdAndMatiereIdAndSemaine(sessionId, matiereId, 3)).thenReturn(attendu);

            // When
            List<Affectation> resultat = service.listerAffectations(sessionId, null, matiereId, 3);

            // Then
            assertThat(resultat).isEqualTo(attendu);
            verify(affectationRepository).findBySessionIdAndMatiereIdAndSemaine(sessionId, matiereId, 3);
        }

        @Test
        @DisplayName("liste les affectations d'une matière (département) dans un centre précis, pour une session et une semaine données")
        void listeParMatiereEtCentre() {
            // Given
            List<Affectation> attendu = List.of(new Affectation(UUID.randomUUID(), centreId, sessionId,
                    formationId, salleId, matiereId, null, Jour.LUNDI, 1, 3, StatutAffectation.PLANIFIEE));
            when(affectationRepository.findBySessionIdAndMatiereIdAndCentreIdAndSemaine(sessionId, matiereId, centreId, 3))
                    .thenReturn(attendu);

            // When
            List<Affectation> resultat = service.listerAffectations(sessionId, centreId, matiereId, 3);

            // Then
            assertThat(resultat).isEqualTo(attendu);
            verify(affectationRepository).findBySessionIdAndMatiereIdAndCentreIdAndSemaine(sessionId, matiereId, centreId, 3);
        }

        @Test
        @DisplayName("liste les affectations d'un enseignant pour une session donnée, toutes semaines confondues")
        void listeParEnseignant() {
            // Given
            UUID enseignantId = UUID.randomUUID();
            List<Affectation> attendu = List.of(
                    new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId, matiereId,
                            enseignantId, Jour.LUNDI, 1, 1, StatutAffectation.ASSIGNEE),
                    new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId, matiereId,
                            enseignantId, Jour.MARDI, 1, 2, StatutAffectation.ASSIGNEE));
            when(affectationRepository.findByEnseignantIdAndSessionId(enseignantId, sessionId)).thenReturn(attendu);

            // When
            List<Affectation> resultat = service.listerParEnseignant(enseignantId, sessionId);

            // Then
            assertThat(resultat).isEqualTo(attendu);
            verify(affectationRepository).findByEnseignantIdAndSessionId(enseignantId, sessionId);
        }

        @Test
        @DisplayName("liste les affectations d'un centre pour une session donnée, toutes semaines confondues")
        void listeParCentre() {
            // Given
            List<Affectation> attendu = List.of(
                    new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId, matiereId,
                            null, Jour.LUNDI, 1, 1, StatutAffectation.PLANIFIEE),
                    new Affectation(UUID.randomUUID(), centreId, sessionId, formationId, salleId, matiereId,
                            UUID.randomUUID(), Jour.MARDI, 1, 2, StatutAffectation.ASSIGNEE));
            when(affectationRepository.findByCentreIdAndSessionId(centreId, sessionId)).thenReturn(attendu);

            // When
            List<Affectation> resultat = service.listerParCentre(centreId, sessionId);

            // Then
            assertThat(resultat).isEqualTo(attendu);
            verify(affectationRepository).findByCentreIdAndSessionId(centreId, sessionId);
        }
    }
}