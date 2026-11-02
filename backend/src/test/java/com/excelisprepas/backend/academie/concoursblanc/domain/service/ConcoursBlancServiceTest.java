package com.excelisprepas.backend.academie.concoursblanc.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.*;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ConcoursBlancRepositoryPort;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.EpreuveConcoursBlancRepositoryPort;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ResultatCandidatRepositoryPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@DisplayName("ConcoursBlancService Tests")
class ConcoursBlancServiceTest {

    private ConcoursBlancRepositoryPort concoursBlancRepository;
    private EpreuveConcoursBlancRepositoryPort epreuveRepository;
    private ResultatCandidatRepositoryPort resultatRepository;
    private ConcoursBlancService concoursBlancService;

    private UUID concoursBlancId;
    private UUID sessionId;
    private UUID centreId;
    private UUID formationId;
    private UUID epreuveId;
    private ConcoursBlanc concoursBlanc;
    private EpreuveConcoursBlanc epreuve;

    @BeforeEach
    void setUp() {
        concoursBlancRepository = mock(ConcoursBlancRepositoryPort.class);
        epreuveRepository = mock(EpreuveConcoursBlancRepositoryPort.class);
        resultatRepository = mock(ResultatCandidatRepositoryPort.class);

        concoursBlancService = new ConcoursBlancService(
                concoursBlancRepository,
                epreuveRepository,
                resultatRepository
        );

        concoursBlancId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
        centreId = UUID.randomUUID();
        formationId = UUID.randomUUID();
        epreuveId = UUID.randomUUID();

        concoursBlanc = new ConcoursBlanc(
                concoursBlancId,
                sessionId,
                "CB N°1",
                1,
                LocalDate.now(),
                Jour.SAMEDI,
                1,
                StatutConcoursBlanc.EN_COURS,
                1,
                3,
                true,
                List.of(centreId),
                false
        );

        epreuve = new EpreuveConcoursBlanc(
                epreuveId,
                concoursBlancId,
                formationId,
                UUID.randomUUID(),
                "Mathématiques",
                120,
                BigDecimal.valueOf(20),
                BigDecimal.valueOf(4),
                null,
                null
        );
        concoursBlanc.setEpreuves(List.of(epreuve));

        when(concoursBlancRepository.findById(concoursBlancId)).thenReturn(Optional.of(concoursBlanc));
        when(epreuveRepository.findByConcoursBlancId(concoursBlancId)).thenReturn(List.of(epreuve));
        when(concoursBlancRepository.findPreviousConcours(any(), anyInt())).thenReturn(Optional.empty());
    }

    @Test
    @DisplayName("Enregistrement réussi calcule les totaux et classements correctement")
    void enregistrerNotes_succes() {
        UUID apprenantId = UUID.randomUUID();
        NoteEpreuve note = new NoteEpreuve(epreuveId, BigDecimal.valueOf(16), StatutNote.NOTE);
        ResultatCandidat candidat = new ResultatCandidat(
                UUID.randomUUID(),
                concoursBlancId,
                formationId,
                centreId,
                apprenantId,
                "Alice Dupont",
                "Lycée A",
                false,
                List.of(note)
        );

        when(resultatRepository.findByConcoursBlancIdAndCentreId(concoursBlancId, centreId))
                .thenReturn(new ArrayList<>());
        when(resultatRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(resultatRepository.findByConcoursBlancId(concoursBlancId))
                .thenAnswer(invocation -> List.of(candidat));

        List<ResultatCandidat> saved = concoursBlancService.enregistrerNotes(concoursBlancId, centreId, List.of(candidat));

        assertThat(saved).hasSize(1);
        ResultatCandidat res = saved.get(0);
        assertThat(res.getTotalPondere()).isEqualByComparingTo(BigDecimal.valueOf(64.00)); // 16 * 4
        assertThat(res.getMoyennePonderee()).isEqualByComparingTo(BigDecimal.valueOf(16.00)); // 64 / 4
        verify(resultatRepository, atLeastOnce()).saveAll(any());
    }

    @Test
    @DisplayName("Évite les doublons en réutilisant l'enregistrement existant pour le même apprenant")
    void enregistrerNotes_eviteDoublons() {
        UUID existantId = UUID.randomUUID();
        UUID apprenantId = UUID.randomUUID();
        ResultatCandidat existant = new ResultatCandidat(
                existantId,
                concoursBlancId,
                formationId,
                centreId,
                apprenantId,
                "Alice Dupont",
                "Lycée A",
                false,
                List.of()
        );

        when(resultatRepository.findByConcoursBlancIdAndCentreId(concoursBlancId, centreId))
                .thenReturn(List.of(existant));
        when(resultatRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(resultatRepository.findByConcoursBlancId(concoursBlancId))
                .thenAnswer(invocation -> List.of(existant));

        // Envoi d'un nouveau résultat avec un ID généré mais pour le même apprenant
        NoteEpreuve note = new NoteEpreuve(epreuveId, BigDecimal.valueOf(18), StatutNote.NOTE);
        ResultatCandidat nouveauPayload = new ResultatCandidat(
                UUID.randomUUID(), // Nouvel ID généré côté appelant
                concoursBlancId,
                formationId,
                centreId,
                apprenantId, // Même apprenant
                "Alice Dupont",
                "Lycée A",
                false,
                List.of(note)
        );

        List<ResultatCandidat> saved = concoursBlancService.enregistrerNotes(concoursBlancId, centreId, List.of(nouveauPayload));

        assertThat(saved).hasSize(1);
        // Doit impérativement réutiliser l'ID existant pour éviter les doublons
        assertThat(saved.get(0).getId()).isEqualTo(existantId);
    }

    @Test
    @DisplayName("Rejette une note négative avec IllegalArgumentException")
    void enregistrerNotes_rejetteNoteNegative() {
        NoteEpreuve note = new NoteEpreuve(epreuveId, BigDecimal.valueOf(-1), StatutNote.NOTE);
        ResultatCandidat candidat = new ResultatCandidat(
                UUID.randomUUID(),
                concoursBlancId,
                formationId,
                centreId,
                UUID.randomUUID(),
                "Bob",
                "Lycée B",
                false,
                List.of(note)
        );

        assertThatThrownBy(() -> concoursBlancService.enregistrerNotes(concoursBlancId, centreId, List.of(candidat)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("négative");
    }

    @Test
    @DisplayName("Rejette une note dépassant le barème max avec IllegalArgumentException")
    void enregistrerNotes_rejetteNoteDepassantBareme() {
        NoteEpreuve note = new NoteEpreuve(epreuveId, BigDecimal.valueOf(25), StatutNote.NOTE);
        ResultatCandidat candidat = new ResultatCandidat(
                UUID.randomUUID(),
                concoursBlancId,
                formationId,
                centreId,
                UUID.randomUUID(),
                "Bob",
                "Lycée B",
                false,
                List.of(note)
        );

        assertThatThrownBy(() -> concoursBlancService.enregistrerNotes(concoursBlancId, centreId, List.of(candidat)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("dépasse le barème max");
    }
}
