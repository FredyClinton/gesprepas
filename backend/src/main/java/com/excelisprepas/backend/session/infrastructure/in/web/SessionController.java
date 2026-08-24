package com.excelisprepas.backend.session.infrastructure.in.web;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.in.*;
import com.excelisprepas.backend.session.infrastructure.in.web.dto.CreerSessionRequest;
import com.excelisprepas.backend.session.infrastructure.in.web.dto.SessionResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final CreerSessionAcademiqueUseCase creerSessionAcademiqueUseCase;
    private final RecupererSessionUseCase recupererSessionUseCase;
    private final ListerSessionsUseCase listerSessionsUseCase;
    private final DemarrerSessionUseCase demarrerSessionUseCase;
    private final CloturerSessionUseCase cloturerSessionUseCase;
    private final SupprimerSessionUseCase supprimerSessionUseCase;

    public SessionController(CreerSessionAcademiqueUseCase creerSessionAcademiqueUseCase,
                             RecupererSessionUseCase recupererSessionUseCase,
                             ListerSessionsUseCase listerSessionsUseCase,
                             DemarrerSessionUseCase demarrerSessionUseCase,
                             CloturerSessionUseCase cloturerSessionUseCase,
                             SupprimerSessionUseCase supprimerSessionUseCase) {
        this.creerSessionAcademiqueUseCase = creerSessionAcademiqueUseCase;
        this.recupererSessionUseCase = recupererSessionUseCase;
        this.listerSessionsUseCase = listerSessionsUseCase;
        this.demarrerSessionUseCase = demarrerSessionUseCase;
        this.cloturerSessionUseCase = cloturerSessionUseCase;
        this.supprimerSessionUseCase = supprimerSessionUseCase;
    }

    private static SessionResponse versReponse(SessionAcademique session) {
        return new SessionResponse(
                session.getId(), session.getAnnee(), session.getDateDebut(),
                session.getDateFin(), session.getStatut());
    }

    @PostMapping
    public ResponseEntity<SessionResponse> creerSession(@Valid @RequestBody CreerSessionRequest request) {
        SessionAcademique session = creerSessionAcademiqueUseCase.creerSession(
                request.annee(), request.dateDebut(), request.dateFin());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(session));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> recupererSession(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererSessionUseCase.recupererSession(id)));
    }

    @GetMapping
    public ResponseEntity<List<SessionResponse>> listerSessions() {
        List<SessionResponse> reponses = listerSessionsUseCase.listerSessions().stream()
                .map(SessionController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/demarrer")
    public ResponseEntity<SessionResponse> demarrerSession(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(demarrerSessionUseCase.demarrerSession(id)));
    }

    @PatchMapping("/{id}/cloturer")
    public ResponseEntity<SessionResponse> cloturerSession(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(cloturerSessionUseCase.cloturerSession(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerSession(@PathVariable UUID id) {
        supprimerSessionUseCase.supprimerSession(id);
        return ResponseEntity.noContent().build();
    }
}