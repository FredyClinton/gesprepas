package com.excelisprepas.backend.rattachement.domain.service;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
import com.excelisprepas.backend.rattachement.domain.port.out.AttributionRoleRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.port.out.RattachementCentreRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class RattachementRoleServiceTest {

    private final UUID utilisateurId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID centreId = UUID.randomUUID();

    private RattachementCentreRepositoryPort rattachementRepository;
    private AttributionRoleRepositoryPort attributionRepository;
    private UtilisateurRepositoryPort utilisateurRepository;
    private CentreRepositoryPort centreRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private RattachementRoleService service;

    @BeforeEach
    void setUp() {
        rattachementRepository = mock(RattachementCentreRepositoryPort.class);
        attributionRepository = mock(AttributionRoleRepositoryPort.class);
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);
        centreRepository = mock(CentreRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        service = new RattachementRoleService(rattachementRepository, attributionRepository,
                utilisateurRepository, centreRepository, sessionRepository);
    }

    private Utilisateur unUtilisateur() {
        return new Utilisateur(utilisateurId, "Ngo", "Marie", "marie.ngo@excelis.cm", "hash", RoleUtilisateur.CAISSIER);
    }

    private Centre unCentreParticipant() {
        Centre centre = new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
        centre.rejoindreSession(sessionId);
        return centre;
    }

    private SessionAcademique uneSessionEnCours() {
        return SessionAcademique.reconstituer(sessionId, "2026-2027",
                LocalDate.of(2026, 9, 1), LocalDate.of(2027, 6, 30), StatutSession.EN_COURS);
    }

    private void stubRattachementValide() {
        when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(unUtilisateur()));
        when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
    }

    @Nested
    @DisplayName("Rattacher")
    class Rattacher {

        @Test
        @DisplayName("crée le rattachement et les attributions de rôles initiaux")
        void rattacherReussit() {
            // Given
            stubRattachementValide();
            when(rattachementRepository.existsByUtilisateurIdAndSessionId(utilisateurId, sessionId)).thenReturn(false);
            when(rattachementRepository.save(any(RattachementCentre.class))).thenAnswer(i -> i.getArgument(0));
            when(attributionRepository.save(any(AttributionRole.class))).thenAnswer(i -> i.getArgument(0));

            // When
            RattachementCentre resultat = service.rattacher(utilisateurId, sessionId, centreId,
                    Set.of(RoleUtilisateur.CHEF_CENTRE, RoleUtilisateur.CHARGE_DOSSIER));

            // Then
            assertThat(resultat.getCentreId()).isEqualTo(centreId);
            verify(attributionRepository, times(2)).save(any(AttributionRole.class));
        }

        @Test
        @DisplayName("refuse si l'utilisateur n'existe pas")
        void refuseSiUtilisateurInexistant() {
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.rattacher(
                    utilisateurId, sessionId, centreId, Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(UtilisateurIntrouvableException.class);
            verify(rattachementRepository, never()).save(any(RattachementCentre.class));
        }

        @Test
        @DisplayName("refuse si le centre n'existe pas")
        void refuseSiCentreInexistant() {
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(unUtilisateur()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.rattacher(
                    utilisateurId, sessionId, centreId, Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(CentreIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la session n'existe pas")
        void refuseSiSessionIntrouvable() {
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(unUtilisateur()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.rattacher(
                    utilisateurId, sessionId, centreId, Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(SessionIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la session est clôturée")
        void refuseSiSessionCloturee() {
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(unUtilisateur()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(unCentreParticipant()));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable action = () -> service.rattacher(
                    utilisateurId, sessionId, centreId, Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
        }

        @Test
        @DisplayName("refuse si le centre n'a pas rejoint la session")
        void refuseSiCentreNonParticipant() {
            Centre centreNonParticipant = new Centre(centreId, "Centre Yaoundé", "Avenue Kennedy", "Yaoundé");
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(unUtilisateur()));
            when(centreRepository.findById(centreId)).thenReturn(Optional.of(centreNonParticipant));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));

            ThrowingCallable action = () -> service.rattacher(
                    utilisateurId, sessionId, centreId, Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(CentreNonParticipantSessionException.class);
        }

        @Test
        @DisplayName("refuse si un rattachement existe déjà pour cette session")
        void refuseSiRattachementDejaExistant() {
            stubRattachementValide();
            when(rattachementRepository.existsByUtilisateurIdAndSessionId(utilisateurId, sessionId)).thenReturn(true);

            ThrowingCallable action = () -> service.rattacher(
                    utilisateurId, sessionId, centreId, Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(RattachementDejaExistantException.class);
        }

        @Test
        @DisplayName("refuse si un rôle initial n'est pas centre-scopé")
        void refuseSiRoleNonCentreScope() {
            stubRattachementValide();
            when(rattachementRepository.existsByUtilisateurIdAndSessionId(utilisateurId, sessionId)).thenReturn(false);

            ThrowingCallable action = () -> service.rattacher(
                    utilisateurId, sessionId, centreId, Set.of(RoleUtilisateur.DIRECTEUR));

            assertThatThrownBy(action).isInstanceOf(RoleNonCentreScopeException.class);
            verify(rattachementRepository, never()).save(any(RattachementCentre.class));
        }
    }

    @Nested
    @DisplayName("Affecter (transfert)")
    class Affecter {

        @Test
        @DisplayName("change le centre, retire les rôles centre-scopés actuels, ajoute les nouveaux")
        void affecterReussit() {
            // Given
            UUID rattachementId = UUID.randomUUID();
            UUID nouveauCentreId = UUID.randomUUID();
            RattachementCentre rattachement = new RattachementCentre(rattachementId, utilisateurId, sessionId, centreId);
            Centre nouveauCentre = new Centre(nouveauCentreId, "Centre Douala", "Adresse", "Douala");
            nouveauCentre.rejoindreSession(sessionId);

            AttributionRole ancienChefCentre = new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.CHEF_CENTRE);
            AttributionRole ancienChargeDossier = new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.CHARGE_DOSSIER);
            AttributionRole comptableNonCentreScope = new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.COMPTABLE);

            when(rattachementRepository.findById(rattachementId)).thenReturn(Optional.of(rattachement));
            when(centreRepository.findById(nouveauCentreId)).thenReturn(Optional.of(nouveauCentre));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(attributionRepository.findByUtilisateurIdAndSessionId(utilisateurId, sessionId))
                    .thenReturn(List.of(ancienChefCentre, ancienChargeDossier, comptableNonCentreScope));
            when(rattachementRepository.save(any(RattachementCentre.class))).thenAnswer(i -> i.getArgument(0));
            when(attributionRepository.save(any(AttributionRole.class))).thenAnswer(i -> i.getArgument(0));

            // When
            RattachementCentre resultat = service.affecter(rattachementId, nouveauCentreId, Set.of(RoleUtilisateur.CAISSIER));

            // Then
            assertThat(resultat.getCentreId()).isEqualTo(nouveauCentreId);
            verify(attributionRepository).deleteById(ancienChefCentre.getId());
            verify(attributionRepository).deleteById(ancienChargeDossier.getId());
            verify(attributionRepository, never()).deleteById(comptableNonCentreScope.getId()); // rôle non centre-scopé préservé
            verify(attributionRepository).save(argThat(a -> a.getRole() == RoleUtilisateur.CAISSIER));
        }

        @Test
        @DisplayName("refuse si le rattachement n'existe pas")
        void refuseSiRattachementIntrouvable() {
            UUID rattachementId = UUID.randomUUID();
            when(rattachementRepository.findById(rattachementId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.affecter(rattachementId, UUID.randomUUID(), Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(RattachementIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si le nouveau centre n'existe pas")
        void refuseSiNouveauCentreIntrouvable() {
            UUID rattachementId = UUID.randomUUID();
            UUID nouveauCentreId = UUID.randomUUID();
            RattachementCentre rattachement = new RattachementCentre(rattachementId, utilisateurId, sessionId, centreId);
            when(rattachementRepository.findById(rattachementId)).thenReturn(Optional.of(rattachement));
            when(centreRepository.findById(nouveauCentreId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.affecter(rattachementId, nouveauCentreId, Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(CentreIntrouvableException.class);
        }

        @Test
        @DisplayName("refuse si la session est clôturée")
        void refuseSiSessionCloturee() {
            UUID rattachementId = UUID.randomUUID();
            UUID nouveauCentreId = UUID.randomUUID();
            RattachementCentre rattachement = new RattachementCentre(rattachementId, utilisateurId, sessionId, centreId);
            Centre nouveauCentre = new Centre(nouveauCentreId, "Centre Douala", "Adresse", "Douala");
            nouveauCentre.rejoindreSession(sessionId);

            when(rattachementRepository.findById(rattachementId)).thenReturn(Optional.of(rattachement));
            when(centreRepository.findById(nouveauCentreId)).thenReturn(Optional.of(nouveauCentre));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(
                    SessionAcademique.reconstituer(sessionId, "2025-2026",
                            LocalDate.of(2025, 9, 1), LocalDate.of(2026, 6, 30), StatutSession.CLOTUREE)));

            ThrowingCallable action = () -> service.affecter(rattachementId, nouveauCentreId, Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(SessionNonUtilisableException.class);
        }

        @Test
        @DisplayName("refuse si le nouveau centre n'a pas rejoint la session")
        void refuseSiNouveauCentreNonParticipant() {
            UUID rattachementId = UUID.randomUUID();
            UUID nouveauCentreId = UUID.randomUUID();
            RattachementCentre rattachement = new RattachementCentre(rattachementId, utilisateurId, sessionId, centreId);
            Centre nouveauCentre = new Centre(nouveauCentreId, "Centre Douala", "Adresse", "Douala"); // n'a pas rejoint

            when(rattachementRepository.findById(rattachementId)).thenReturn(Optional.of(rattachement));
            when(centreRepository.findById(nouveauCentreId)).thenReturn(Optional.of(nouveauCentre));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));

            ThrowingCallable action = () -> service.affecter(rattachementId, nouveauCentreId, Set.of(RoleUtilisateur.CAISSIER));

            assertThatThrownBy(action).isInstanceOf(CentreNonParticipantSessionException.class);
        }

        @Test
        @DisplayName("refuse si un nouveau rôle n'est pas centre-scopé")
        void refuseSiNouveauRoleNonCentreScope() {
            UUID rattachementId = UUID.randomUUID();
            UUID nouveauCentreId = UUID.randomUUID();
            RattachementCentre rattachement = new RattachementCentre(rattachementId, utilisateurId, sessionId, centreId);
            Centre nouveauCentre = new Centre(nouveauCentreId, "Centre Douala", "Adresse", "Douala");
            nouveauCentre.rejoindreSession(sessionId);

            when(rattachementRepository.findById(rattachementId)).thenReturn(Optional.of(rattachement));
            when(centreRepository.findById(nouveauCentreId)).thenReturn(Optional.of(nouveauCentre));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));

            ThrowingCallable action = () -> service.affecter(rattachementId, nouveauCentreId, Set.of(RoleUtilisateur.COMPTABLE));

            assertThatThrownBy(action).isInstanceOf(RoleNonCentreScopeException.class);
            verify(attributionRepository, never()).deleteById(any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Ajouter / retirer un rôle")
    class AjouterRetirerRole {

        @Test
        @DisplayName("ajouterRole() réussit pour un rôle centre-scopé quand un rattachement existe")
        void ajouterRoleCentreScopeReussitAvecRattachement() {
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(unUtilisateur()));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(rattachementRepository.existsByUtilisateurIdAndSessionId(utilisateurId, sessionId)).thenReturn(true);
            when(attributionRepository.existsByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, RoleUtilisateur.CAISSIER))
                    .thenReturn(false);
            when(attributionRepository.save(any(AttributionRole.class))).thenAnswer(i -> i.getArgument(0));

            AttributionRole resultat = service.ajouterRole(utilisateurId, sessionId, RoleUtilisateur.CAISSIER);

            assertThat(resultat.getRole()).isEqualTo(RoleUtilisateur.CAISSIER);
        }

        @Test
        @DisplayName("ajouterRole() refuse un rôle centre-scopé sans rattachement existant")
        void ajouterRoleCentreScopeRefuseSansRattachement() {
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(unUtilisateur()));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(rattachementRepository.existsByUtilisateurIdAndSessionId(utilisateurId, sessionId)).thenReturn(false);

            ThrowingCallable action = () -> service.ajouterRole(utilisateurId, sessionId, RoleUtilisateur.CAISSIER);

            assertThatThrownBy(action).isInstanceOf(RattachementRequisException.class);
            verify(attributionRepository, never()).save(any(AttributionRole.class));
        }

        @Test
        @DisplayName("ajouterRole() réussit pour un rôle non centre-scopé sans rattachement")
        void ajouterRoleNonCentreScopeReussitSansRattachement() {
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(unUtilisateur()));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(attributionRepository.existsByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, RoleUtilisateur.COMPTABLE))
                    .thenReturn(false);
            when(attributionRepository.save(any(AttributionRole.class))).thenAnswer(i -> i.getArgument(0));

            AttributionRole resultat = service.ajouterRole(utilisateurId, sessionId, RoleUtilisateur.COMPTABLE);

            assertThat(resultat.getRole()).isEqualTo(RoleUtilisateur.COMPTABLE);
            verify(rattachementRepository, never()).existsByUtilisateurIdAndSessionId(any(UUID.class), any(UUID.class));
        }

        @Test
        @DisplayName("ajouterRole() refuse si l'utilisateur n'existe pas")
        void ajouterRoleRefuseSiUtilisateurInexistant() {
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.ajouterRole(utilisateurId, sessionId, RoleUtilisateur.COMPTABLE);

            assertThatThrownBy(action).isInstanceOf(UtilisateurIntrouvableException.class);
        }

        @Test
        @DisplayName("ajouterRole() refuse si le rôle est déjà attribué")
        void ajouterRoleRefuseSiDejaAttribue() {
            when(utilisateurRepository.findById(utilisateurId)).thenReturn(Optional.of(unUtilisateur()));
            when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(uneSessionEnCours()));
            when(attributionRepository.existsByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, RoleUtilisateur.COMPTABLE))
                    .thenReturn(true);

            ThrowingCallable action = () -> service.ajouterRole(utilisateurId, sessionId, RoleUtilisateur.COMPTABLE);

            assertThatThrownBy(action).isInstanceOf(RoleDejaAttribueException.class);
        }

        @Test
        @DisplayName("retirerRole() supprime l'attribution existante")
        void retirerRoleReussit() {
            AttributionRole attribution = new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.COMPTABLE);
            when(attributionRepository.findByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, RoleUtilisateur.COMPTABLE))
                    .thenReturn(Optional.of(attribution));

            service.retirerRole(utilisateurId, sessionId, RoleUtilisateur.COMPTABLE);

            verify(attributionRepository).deleteById(attribution.getId());
        }

        @Test
        @DisplayName("retirerRole() lève une exception si l'attribution n'existe pas")
        void retirerRoleRefuseSiIntrouvable() {
            when(attributionRepository.findByUtilisateurIdAndSessionIdAndRole(utilisateurId, sessionId, RoleUtilisateur.COMPTABLE))
                    .thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.retirerRole(utilisateurId, sessionId, RoleUtilisateur.COMPTABLE);

            assertThatThrownBy(action).isInstanceOf(AttributionRoleIntrouvableException.class);
        }
    }

    @Nested
    @DisplayName("Lecture et suppression")
    class LectureEtSuppression {

        @Test
        @DisplayName("recuperer() retourne le rattachement s'il existe")
        void recupererRetourneLeRattachement() {
            RattachementCentre rattachement = new RattachementCentre(UUID.randomUUID(), utilisateurId, sessionId, centreId);
            when(rattachementRepository.findById(rattachement.getId())).thenReturn(Optional.of(rattachement));

            RattachementCentre resultat = service.recuperer(rattachement.getId());

            assertThat(resultat).isEqualTo(rattachement);
        }

        @Test
        @DisplayName("recuperer() lève une exception si absent")
        void recupererLeveExceptionSiAbsent() {
            UUID id = UUID.randomUUID();
            when(rattachementRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.recuperer(id);

            assertThatThrownBy(action).isInstanceOf(RattachementIntrouvableException.class);
        }

        @Test
        @DisplayName("listerParCentreEtSession() retourne les rattachements du centre pour la session")
        void listerParCentreEtSessionRetourneLaListe() {
            when(rattachementRepository.findByCentreIdAndSessionId(centreId, sessionId)).thenReturn(List.of(
                    new RattachementCentre(UUID.randomUUID(), utilisateurId, sessionId, centreId)));

            List<RattachementCentre> resultat = service.listerParCentreEtSession(centreId, sessionId);

            assertThat(resultat).hasSize(1);
        }

        @Test
        @DisplayName("listerParUtilisateurEtSession() retourne les rôles de l'utilisateur pour la session")
        void listerParUtilisateurEtSessionRetourneLesRoles() {
            when(attributionRepository.findByUtilisateurIdAndSessionId(utilisateurId, sessionId)).thenReturn(List.of(
                    new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.CHEF_CENTRE),
                    new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.CAISSIER)));

            List<AttributionRole> resultat = service.listerParUtilisateurEtSession(utilisateurId, sessionId);

            assertThat(resultat).hasSize(2);
        }

        @Test
        @DisplayName("supprimer() retire le rattachement et les rôles centre-scopés, préserve les autres")
        void supprimerRetireLeRattachementEtLesRolesCentreScopes() {
            UUID rattachementId = UUID.randomUUID();
            RattachementCentre rattachement = new RattachementCentre(rattachementId, utilisateurId, sessionId, centreId);
            AttributionRole chefCentre = new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.CHEF_CENTRE);
            AttributionRole comptable = new AttributionRole(UUID.randomUUID(), utilisateurId, sessionId, RoleUtilisateur.COMPTABLE);

            when(rattachementRepository.findById(rattachementId)).thenReturn(Optional.of(rattachement));
            when(attributionRepository.findByUtilisateurIdAndSessionId(utilisateurId, sessionId))
                    .thenReturn(List.of(chefCentre, comptable));

            service.supprimer(rattachementId);

            verify(attributionRepository).deleteById(chefCentre.getId());
            verify(attributionRepository, never()).deleteById(comptable.getId());
            verify(rattachementRepository).deleteById(rattachementId);
        }

        @Test
        @DisplayName("supprimer() lève une exception si le rattachement n'existe pas")
        void supprimerLeveExceptionSiAbsent() {
            UUID id = UUID.randomUUID();
            when(rattachementRepository.findById(id)).thenReturn(Optional.empty());

            ThrowingCallable action = () -> service.supprimer(id);

            assertThatThrownBy(action).isInstanceOf(RattachementIntrouvableException.class);
        }
    }
}