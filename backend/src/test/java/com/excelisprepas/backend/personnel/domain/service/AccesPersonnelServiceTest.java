package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.personnel.domain.model.AccesPersonnel;
import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.model.StatutAcces;
import com.excelisprepas.backend.personnel.domain.port.out.AccesPersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.PersonnelIntrouvableException;
import com.excelisprepas.backend.shared.exception.SessionIntrouvableException;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("AccesPersonnelService")
class AccesPersonnelServiceTest {

    private AccesPersonnelRepositoryPort accesPersonnelRepository;
    private PersonnelRepositoryPort personnelRepository;
    private UtilisateurRepositoryPort utilisateurRepository;
    private SessionAcademiqueRepositoryPort sessionRepository;
    private AccesPersonnelService service;

    private final UUID personnelId = UUID.randomUUID();
    private final UUID sessionId = UUID.randomUUID();
    private final UUID phaseId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        accesPersonnelRepository = mock(AccesPersonnelRepositoryPort.class);
        personnelRepository = mock(PersonnelRepositoryPort.class);
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);
        sessionRepository = mock(SessionAcademiqueRepositoryPort.class);
        service = new AccesPersonnelService(accesPersonnelRepository, personnelRepository, utilisateurRepository, sessionRepository);

        when(personnelRepository.findById(personnelId))
                .thenReturn(Optional.of(new Personnel(personnelId, "Doe", "John")));
        when(utilisateurRepository.findById(personnelId))
                .thenReturn(Optional.of(new Utilisateur(personnelId, "Doe", "John", "john@example.com", "hash", RoleUtilisateur.CHEF_CENTRE)));
        when(sessionRepository.findById(sessionId))
                .thenReturn(Optional.of(new SessionAcademique(sessionId, "2026-2027", LocalDate.now(), LocalDate.now().plusMonths(9))));
        when(accesPersonnelRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    @DisplayName("accorderAcces crée un nouvel accès avec statut ACCORDE si inexistant")
    void accorderAccesNouveau() {
        when(accesPersonnelRepository.findByPersonnelIdAndSessionIdAndPhaseId(personnelId, sessionId, phaseId))
                .thenReturn(Optional.empty());

        AccesPersonnel resultat = service.accorderAcces(RoleUtilisateur.DIRECTEUR, personnelId, sessionId, phaseId, "Autorisation accordée");

        assertThat(resultat).isNotNull();
        assertThat(resultat.getPersonnelId()).isEqualTo(personnelId);
        assertThat(resultat.getSessionId()).isEqualTo(sessionId);
        assertThat(resultat.getPhaseId()).isEqualTo(phaseId);
        assertThat(resultat.getStatut()).isEqualTo(StatutAcces.ACCORDE);
        assertThat(resultat.getMotif()).isEqualTo("Autorisation accordée");
        verify(accesPersonnelRepository).save(any(AccesPersonnel.class));
    }

    @Test
    @DisplayName("bloquerAcces met à jour le statut d'un accès existant vers BLOQUE")
    void bloquerAccesExistant() {
        AccesPersonnel existant = new AccesPersonnel(UUID.randomUUID(), personnelId, sessionId, phaseId,
                StatutAcces.ACCORDE, "Initial", LocalDateTime.now().minusDays(1));
        when(accesPersonnelRepository.findByPersonnelIdAndSessionIdAndPhaseId(personnelId, sessionId, phaseId))
                .thenReturn(Optional.of(existant));

        AccesPersonnel resultat = service.bloquerAcces(RoleUtilisateur.DIRECTEUR, personnelId, sessionId, phaseId, "Suspendu par la direction");

        assertThat(resultat.getStatut()).isEqualTo(StatutAcces.BLOQUE);
        assertThat(resultat.getMotif()).isEqualTo("Suspendu par la direction");
        verify(accesPersonnelRepository).save(existant);
    }

    @Test
    @DisplayName("definirAcces échoue si le personnel est introuvable")
    void personnelIntrouvable() {
        UUID inconnu = UUID.randomUUID();
        when(personnelRepository.findById(inconnu)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.bloquerAcces(RoleUtilisateur.DIRECTEUR, inconnu, sessionId, phaseId, "Motif"))
                .isInstanceOf(PersonnelIntrouvableException.class);
    }

    @Test
    @DisplayName("definirAcces échoue si la session est introuvable")
    void sessionIntrouvable() {
        UUID sessionInconnue = UUID.randomUUID();
        when(sessionRepository.findById(sessionInconnue)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.bloquerAcces(RoleUtilisateur.DIRECTEUR, personnelId, sessionInconnue, phaseId, "Motif"))
                .isInstanceOf(SessionIntrouvableException.class);
    }

    @Test
    @DisplayName("listerParSessionEtPhase filtre correctement")
    void listerFiltreCorrectement() {
        AccesPersonnel a1 = AccesPersonnel.nouveau(personnelId, sessionId, phaseId, StatutAcces.ACCORDE, null);
        when(accesPersonnelRepository.findBySessionIdAndPhaseId(sessionId, phaseId)).thenReturn(List.of(a1));

        List<AccesPersonnel> resultats = service.listerParSessionEtPhase(sessionId, phaseId);

        assertThat(resultats).hasSize(1);
        assertThat(resultats.get(0)).isEqualTo(a1);
    }

    @Test
    @DisplayName("definirAcces échoue si le personnel ne possède pas de compte utilisateur")
    void personnelSansCompteUtilisateur() {
        when(utilisateurRepository.findById(personnelId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.bloquerAcces(RoleUtilisateur.DIRECTEUR, personnelId, sessionId, phaseId, "Motif"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("compte utilisateur");
    }

    @Test
    @DisplayName("bloquerAcces échoue si on tente de bloquer le compte du Directeur")
    void interdictionBloquerDirecteur() {
        when(utilisateurRepository.findById(personnelId))
                .thenReturn(Optional.of(new Utilisateur(personnelId, "Doe", "John", "dir@example.com", "hash", RoleUtilisateur.DIRECTEUR)));

        assertThatThrownBy(() -> service.bloquerAcces(RoleUtilisateur.DIRECTEUR, personnelId, sessionId, phaseId, "Motif"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Le compte du Directeur ne peut pas être bloqué");
    }

    @Test
    @DisplayName("bloquerAcces refuse qu'un Chef de département bloque le compte d'un Directeur académique")
    void chefDepartementNePeutPasBloquerDirecteurAcademique() {
        when(utilisateurRepository.findById(personnelId))
                .thenReturn(Optional.of(new Utilisateur(personnelId, "Doe", "John", "da@example.com", "hash", RoleUtilisateur.DIRECTEUR_ACADEMIQUE)));

        assertThatThrownBy(() -> service.bloquerAcces(RoleUtilisateur.CHEF_DEPARTEMENT, personnelId, sessionId, phaseId, "Motif"))
                .isInstanceOf(com.excelisprepas.backend.personnel.domain.exception.AttributionRoleInterditeException.class);
    }

    @Test
    @DisplayName("bloquerAcces refuse un appelant sans rôle (pas de jeton)")
    void appelantInconnuRefuse() {
        assertThatThrownBy(() -> service.bloquerAcces(null, personnelId, sessionId, phaseId, "Motif"))
                .isInstanceOf(com.excelisprepas.backend.personnel.domain.exception.AttributionRoleInterditeException.class);
    }
}
