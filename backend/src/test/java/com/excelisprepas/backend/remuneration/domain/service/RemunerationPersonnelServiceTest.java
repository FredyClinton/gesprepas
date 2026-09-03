package com.excelisprepas.backend.remuneration.domain.service;

import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;
import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueSalairePersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import com.excelisprepas.backend.remuneration.domain.model.BordereauPaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.model.LigneSaisiePaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.port.out.BordereauPaiePersonnelRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class RemunerationPersonnelServiceTest {

    private PersonnelRepositoryPort personnelRepository;
    private HistoriqueSalairePersonnelRepositoryPort historiqueSalaireRepository;
    private BordereauPaiePersonnelRepositoryPort bordereauPaiePersonnelRepository;
    private SaisirSortieUseCase saisirSortieUseCase;
    private RemunerationPersonnelService service;

    @BeforeEach
    void setUp() {
        personnelRepository = mock(PersonnelRepositoryPort.class);
        historiqueSalaireRepository = mock(HistoriqueSalairePersonnelRepositoryPort.class);
        bordereauPaiePersonnelRepository = mock(BordereauPaiePersonnelRepositoryPort.class);
        saisirSortieUseCase = mock(SaisirSortieUseCase.class);

        service = new RemunerationPersonnelService(
                personnelRepository, historiqueSalaireRepository,
                bordereauPaiePersonnelRepository, saisirSortieUseCase);
    }

    @Test
    @DisplayName("preparerSimulation() liste tout le personnel avec le salaire de référence applicable")
    void preparerSimulationFonctionne() {
        UUID sessionId = UUID.randomUUID();
        Personnel p1 = new Personnel(UUID.randomUUID(), "Tchinda", "Paul", "699001122", "CNI123", "paul@excelis.cm");
        Personnel p2 = new Personnel(UUID.randomUUID(), "Mballa", "Jeanne", "699334455", "CNI456", "jeanne@excelis.cm");

        when(personnelRepository.findAll()).thenReturn(List.of(p1, p2));
        when(historiqueSalaireRepository.findDernierSalaireApplicable(eq(p1.getId()), eq(sessionId), any(LocalDate.class)))
                .thenReturn(Optional.of(new HistoriqueSalairePersonnel(UUID.randomUUID(), p1.getId(), sessionId, new BigDecimal("150000"), LocalDate.of(2026, 6, 1))));
        when(historiqueSalaireRepository.findDernierSalaireApplicable(eq(p2.getId()), eq(sessionId), any(LocalDate.class)))
                .thenReturn(Optional.empty());

        BordereauPaiePersonnel simu = service.preparerSimulation(sessionId, LocalDate.of(2026, 7, 15), "Paie Mi-Juillet", "COMPTABLE");

        assertThat(simu.getFiches()).hasSize(2);
        assertThat(simu.getFiches().get(0).getSalaireReference()).isEqualByComparingTo("150000");
        assertThat(simu.getFiches().get(1).getSalaireReference()).isEqualByComparingTo("0");
    }

    @Test
    @DisplayName("validerBordereau() génère une Sortie financière globale (centreId=null) et sauvegarde le bordereau")
    void validerBordereauFonctionne() {
        UUID sessionId = UUID.randomUUID();
        UUID p1Id = UUID.randomUUID();
        UUID p2Id = UUID.randomUUID();

        List<LigneSaisiePaiePersonnel> lignes = List.of(
                new LigneSaisiePaiePersonnel(p1Id, new BigDecimal("150000"), new BigDecimal("150000"), "Salaire complet"),
                new LigneSaisiePaiePersonnel(p2Id, new BigDecimal("200000"), BigDecimal.ZERO, "Non payé sur cette vague")
        );

        Sortie sortie = mock(Sortie.class);
        when(sortie.getId()).thenReturn(UUID.randomUUID());
        when(saisirSortieUseCase.saisirSortie(eq(sessionId), any(UUID.class), eq(new BigDecimal("150000")),
                any(LocalDate.class), any(UUID.class), isNull(), anyString()))
                .thenReturn(sortie);

        when(bordereauPaiePersonnelRepository.save(any(BordereauPaiePersonnel.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        BordereauPaiePersonnel resultat = service.validerBordereau(
                sessionId, LocalDate.of(2026, 7, 15), "Paie Mi-Juillet", lignes, "DIRECTEUR");

        assertThat(resultat.getNombrePersonnelsPayes()).isEqualTo(1);
        assertThat(resultat.getMontantTotalGlobal()).isEqualByComparingTo("150000");
        verify(saisirSortieUseCase).saisirSortie(
                eq(sessionId), any(UUID.class), eq(new BigDecimal("150000")),
                eq(LocalDate.of(2026, 7, 15)), any(UUID.class), isNull(), eq("DIRECTEUR"));
        verify(bordereauPaiePersonnelRepository).save(any(BordereauPaiePersonnel.class));
    }

    @Test
    @DisplayName("validerBordereau() rejette une liste où aucun montant n'est supérieur à zéro")
    void validerBordereauRejetteSiAucunPaye() {
        UUID sessionId = UUID.randomUUID();
        List<LigneSaisiePaiePersonnel> lignes = List.of(
                new LigneSaisiePaiePersonnel(UUID.randomUUID(), new BigDecimal("150000"), BigDecimal.ZERO, "Reporté")
        );

        assertThatThrownBy(() -> service.validerBordereau(sessionId, LocalDate.now(), "Test", lignes, "ADMIN"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Aucun personnel sélectionné");
    }
}
