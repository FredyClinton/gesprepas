package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web.dto;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.StatutNote;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record EnregistrerNotesRequest(
        @NotNull UUID centreId,
        List<CandidatNotesInput> candidats
) {
    public record CandidatNotesInput(
            UUID id, // si déjà existant, sinon null pour nouveau candidat
            @NotNull UUID formationId,
            UUID apprenantId, // nullable si hors liste
            @NotNull String nomComplet,
            String etablissementOrigine,
            boolean horsListe,
            List<NoteInput> notes
    ) {}

    public record NoteInput(
            @NotNull UUID epreuveId,
            BigDecimal note,
            @NotNull StatutNote statut
    ) {}
}

