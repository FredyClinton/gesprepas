package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.StatutMouvement;
import com.excelisprepas.backend.financier.domain.model.ValidationMouvement;
import com.excelisprepas.backend.financier.domain.port.out.MouvementFinancierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.ValidationMouvementRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.MouvementFinancierIntrouvableException;
import com.excelisprepas.backend.shared.exception.UtilisateurIntrouvableException;
import org.assertj.core.api.ThrowableAssert.ThrowingCallable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ValidationMouvementServiceTest {

    private final UUID sessionId = UUID.randomUUID();
    private final UUID motifId = UUID.randomUUID();
    private final UUID centreId = UUID.randomUUID();
    private final UUID saisiParUtilisateurId = UUID.randomUUID();
    private final UUID validateurUtilisateurId = UUID.randomUUID();

    private MouvementFinancierRepositoryPort mouvementRepository;
    private ValidationMouvementRepositoryPort validationRepository;
    private UtilisateurRepositoryPort utilisateurRepository;
    private ValidationMouvementService service;

    @BeforeEach
    void setUp() {
        mouvementRepository = mock(MouvementFinancierRepositoryPort.class);
        validationRepository = mock(ValidationMouvementRepositoryPort.class);
        utilisateurRepository = mock(UtilisateurRepositoryPort.class);
        service = new ValidationMouvementService(mouvementRepository, validationRepository, utilisateurRepository);
    }

    private Entree uneEntreeEnAttente() {
        return new Entree(UUID.randomUUID(), sessionId, motifId, new BigDecimal("45000"),
                LocalDate.of(2026, 9, 15), saisiParUtilisateurId, centreId, null, null);
    }

    private Utilisateur unUtilisateur() {
        return new Utilisateur(validateurUtilisateurId, "Fotso", "Marie", "marie.fotso@excelis.cm",
                "hash", RoleUtilisateur.COMPTABLE);
    }

    @Test
    @DisplayName("valide un mouvement : change son statut et enregistre la décision")
    void validerMouvementReussit() {
        // Given
        Entree entree = uneEntreeEnAttente();
        when(mouvementRepository.findById(entree.getId())).thenReturn(Optional.of(entree));
        when(utilisateurRepository.findById(validateurUtilisateurId)).thenReturn(Optional.of(unUtilisateur()));
        when(mouvementRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(validationRepository.save(any(ValidationMouvement.class))).thenAnswer(i -> i.getArgument(0));

        // When
        ValidationMouvement resultat = service.validerMouvement(entree.getId(), StatutMouvement.VALIDE, validateurUtilisateurId);

        // Then
        assertThat(entree.getStatut()).isEqualTo(StatutMouvement.VALIDE);
        assertThat(resultat.getDecision()).isEqualTo(StatutMouvement.VALIDE);
        assertThat(resultat.getMouvementFinancierId()).isEqualTo(entree.getId());
        assertThat(resultat.getValidateurUtilisateurId()).isEqualTo(validateurUtilisateurId);
        verify(mouvementRepository).save(entree);
    }

    @Test
    @DisplayName("rejette un mouvement : change son statut à REJETE")
    void rejetteMouvementReussit() {
        Entree entree = uneEntreeEnAttente();
        when(mouvementRepository.findById(entree.getId())).thenReturn(Optional.of(entree));
        when(utilisateurRepository.findById(validateurUtilisateurId)).thenReturn(Optional.of(unUtilisateur()));
        when(mouvementRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        when(validationRepository.save(any(ValidationMouvement.class))).thenAnswer(i -> i.getArgument(0));

        ValidationMouvement resultat = service.validerMouvement(entree.getId(), StatutMouvement.REJETE, validateurUtilisateurId);

        assertThat(entree.getStatut()).isEqualTo(StatutMouvement.REJETE);
        assertThat(resultat.getDecision()).isEqualTo(StatutMouvement.REJETE);
    }

    @Test
    @DisplayName("refuse si le mouvement n'existe pas")
    void refuseSiMouvementIntrouvable() {
        UUID id = UUID.randomUUID();
        when(mouvementRepository.findById(id)).thenReturn(Optional.empty());

        ThrowingCallable action = () -> service.validerMouvement(id, StatutMouvement.VALIDE, validateurUtilisateurId);

        assertThatThrownBy(action).isInstanceOf(MouvementFinancierIntrouvableException.class);
    }

    @Test
    @DisplayName("refuse si le validateur n'existe pas")
    void refuseSiValidateurIntrouvable() {
        Entree entree = uneEntreeEnAttente();
        when(mouvementRepository.findById(entree.getId())).thenReturn(Optional.of(entree));
        when(utilisateurRepository.findById(validateurUtilisateurId)).thenReturn(Optional.empty());

        ThrowingCallable action = () -> service.validerMouvement(entree.getId(), StatutMouvement.VALIDE, validateurUtilisateurId);

        assertThatThrownBy(action).isInstanceOf(UtilisateurIntrouvableException.class);
        verify(mouvementRepository, never()).save(any());
    }

    @Test
    @DisplayName("refuse si le mouvement a déjà été traité")
    void refuseSiMouvementDejaTraite() {
        Entree entree = uneEntreeEnAttente();
        entree.appliquerDecision(StatutMouvement.VALIDE);
        when(mouvementRepository.findById(entree.getId())).thenReturn(Optional.of(entree));
        when(utilisateurRepository.findById(validateurUtilisateurId)).thenReturn(Optional.of(unUtilisateur()));

        ThrowingCallable action = () -> service.validerMouvement(entree.getId(), StatutMouvement.REJETE, validateurUtilisateurId);

        assertThatThrownBy(action).isInstanceOf(IllegalStateException.class);
        verify(validationRepository, never()).save(any(ValidationMouvement.class));
    }

    @Test
    @DisplayName("refuse si la décision est EN_ATTENTE")
    void refuseSiDecisionEnAttente() {
        Entree entree = uneEntreeEnAttente();
        when(mouvementRepository.findById(entree.getId())).thenReturn(Optional.of(entree));
        when(utilisateurRepository.findById(validateurUtilisateurId)).thenReturn(Optional.of(unUtilisateur()));

        ThrowingCallable action = () -> service.validerMouvement(entree.getId(), StatutMouvement.EN_ATTENTE, validateurUtilisateurId);

        assertThatThrownBy(action).isInstanceOf(IllegalArgumentException.class);
    }
}