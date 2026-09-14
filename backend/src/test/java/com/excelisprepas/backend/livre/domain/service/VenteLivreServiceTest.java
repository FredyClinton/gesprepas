package com.excelisprepas.backend.livre.domain.service;

import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.livre.domain.model.Livre;
import com.excelisprepas.backend.livre.domain.model.VenteLivre;
import com.excelisprepas.backend.livre.domain.port.in.CalculerStatsVentesLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.in.EnregistrerVenteLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.out.LivreRepositoryPort;
import com.excelisprepas.backend.livre.domain.port.out.VenteLivreRepositoryPort;
import com.excelisprepas.backend.shared.exception.LivreIndisponibleException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VenteLivreServiceTest {

    private VenteLivreRepositoryPort venteLivreRepositoryPort;
    private LivreRepositoryPort livreRepositoryPort;
    private SaisirEntreeUseCase saisirEntreeUseCase;
    private MotifRepositoryPort motifRepositoryPort;
    private CentreRepositoryPort centreRepositoryPort;
    private ApprenantRepositoryPort apprenantRepositoryPort;

    private VenteLivreService service;

    private UUID sessionId;
    private UUID centreId;
    private UUID userId;
    private Centre centre;

    @BeforeEach
    void setUp() {
        venteLivreRepositoryPort = mock(VenteLivreRepositoryPort.class);
        livreRepositoryPort = mock(LivreRepositoryPort.class);
        saisirEntreeUseCase = mock(SaisirEntreeUseCase.class);
        motifRepositoryPort = mock(MotifRepositoryPort.class);
        centreRepositoryPort = mock(CentreRepositoryPort.class);
        apprenantRepositoryPort = mock(ApprenantRepositoryPort.class);

        service = new VenteLivreService(
                venteLivreRepositoryPort,
                livreRepositoryPort,
                saisirEntreeUseCase,
                motifRepositoryPort,
                centreRepositoryPort,
                apprenantRepositoryPort
        );

        sessionId = UUID.randomUUID();
        centreId = UUID.randomUUID();
        userId = UUID.randomUUID();
        centre = new Centre(centreId, "Centre Principal", "Rue 12", "Abidjan");
        when(centreRepositoryPort.findById(centreId)).thenReturn(Optional.of(centre));
        when(centreRepositoryPort.findAll()).thenReturn(List.of(centre));
    }

    @Test
    @DisplayName("Enregistrer une vente d'un livre disponible persiste la vente")
    void enregistrerVente_livreDisponible() {
        UUID livreId = UUID.randomUUID();
        Livre livre = new Livre(livreId, "AXIOME", "Manuel de mathématiques", new BigDecimal("10000"), true, LocalDateTime.now());
        when(livreRepositoryPort.findById(livreId)).thenReturn(Optional.of(livre));
        when(venteLivreRepositoryPort.saveAll(any())).thenAnswer(i -> i.getArgument(0));

        EnregistrerVenteLivreUseCase.CommandeVente commande = new EnregistrerVenteLivreUseCase.CommandeVente(
                sessionId,
                centreId,
                LocalDate.now(),
                "Kouamé Jean",
                null,
                true,
                userId,
                List.of(new EnregistrerVenteLivreUseCase.LigneVente(livreId, 3))
        );

        List<VenteLivre> resultat = service.enregistrerVente(commande);

        assertThat(resultat).hasSize(1);
        VenteLivre v = resultat.get(0);
        assertThat(v.getQuantite()).isEqualTo(3);
        assertThat(v.getMontantTotal()).isEqualByComparingTo("30000");
        assertThat(v.getNomAcheteur()).isEqualTo("Kouamé Jean");
        assertThat(v.isEstExterne()).isTrue();

        verify(venteLivreRepositoryPort).saveAll(any());
    }

    @Test
    @DisplayName("Enregistrer une vente d'un livre non disponible lève LivreIndisponibleException")
    void enregistrerVente_livreIndisponible_leveException() {
        UUID livreId = UUID.randomUUID();
        Livre livre = new Livre(livreId, "VECTEUR", "Physique", new BigDecimal("9000"), false, LocalDateTime.now());
        when(livreRepositoryPort.findById(livreId)).thenReturn(Optional.of(livre));

        EnregistrerVenteLivreUseCase.CommandeVente commande = new EnregistrerVenteLivreUseCase.CommandeVente(
                sessionId,
                centreId,
                LocalDate.now(),
                "Parent d'élève",
                null,
                true,
                userId,
                List.of(new EnregistrerVenteLivreUseCase.LigneVente(livreId, 5))
        );

        assertThatThrownBy(() -> service.enregistrerVente(commande))
                .isInstanceOf(LivreIndisponibleException.class)
                .hasMessageContaining("VECTEUR");

        verify(venteLivreRepositoryPort, never()).saveAll(any());
    }

    @Test
    @DisplayName("CalculerStats ventile correctement par livre et par centre")
    void calculerStats_calculeTotauxEtVentilations() {
        UUID livre1Id = UUID.randomUUID();
        UUID livre2Id = UUID.randomUUID();
        Livre l1 = new Livre(livre1Id, "AXIOME", "Maths", new BigDecimal("10000"), true, LocalDateTime.now());
        Livre l2 = new Livre(livre2Id, "VECTEUR", "Physique", new BigDecimal("9000"), true, LocalDateTime.now());
        when(livreRepositoryPort.findAll()).thenReturn(List.of(l1, l2));

        VenteLivre v1 = new VenteLivre(UUID.randomUUID(), sessionId, centreId, LocalDate.now(),
                "Élève A", UUID.randomUUID(), false, livre1Id, 2, new BigDecimal("10000"), new BigDecimal("20000"), null, userId, LocalDateTime.now());
        VenteLivre v2 = new VenteLivre(UUID.randomUUID(), sessionId, centreId, LocalDate.now(),
                "Acheteur B", null, true, livre2Id, 1, new BigDecimal("9000"), new BigDecimal("9000"), null, userId, LocalDateTime.now());

        when(venteLivreRepositoryPort.findWithFilters(eq(sessionId), any(), any(), any(), any()))
                .thenReturn(List.of(v1, v2));

        CalculerStatsVentesLivresUseCase.StatsVentes stats = service.calculerStats(sessionId, null, null, null);

        assertThat(stats.totalQuantite()).isEqualTo(3);
        assertThat(stats.totalMontant()).isEqualByComparingTo("29000");

        // Ventilation par livre
        assertThat(stats.parLivre()).hasSize(2);
        CalculerStatsVentesLivresUseCase.VentilationLivre vLivre1 = stats.parLivre().stream()
                .filter(item -> item.livreId().equals(livre1Id)).findFirst().orElseThrow();
        assertThat(vLivre1.quantiteVendue()).isEqualTo(2);
        assertThat(vLivre1.montantTotal()).isEqualByComparingTo("20000");

        // Ventilation par centre
        assertThat(stats.parCentre()).hasSize(1);
        CalculerStatsVentesLivresUseCase.VentilationCentre vCentre = stats.parCentre().get(0);
        assertThat(vCentre.centreId()).isEqualTo(centreId);
        assertThat(vCentre.quantiteVendue()).isEqualTo(3);
        assertThat(vCentre.montantTotal()).isEqualByComparingTo("29000");
    }
}
