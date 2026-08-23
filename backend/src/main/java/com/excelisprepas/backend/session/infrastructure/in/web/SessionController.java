package com.excelisprepas.backend.session.infrastructure.in.web;

import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.in.CreerSessionAcademiqueUseCase;
import com.excelisprepas.backend.session.infrastructure.in.web.dto.CreerSessionRequest;
import com.excelisprepas.backend.session.infrastructure.in.web.dto.SessionResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final CreerSessionAcademiqueUseCase creerSessionUseCase;

    public SessionController(CreerSessionAcademiqueUseCase creerSessionUseCase) {
        this.creerSessionUseCase = creerSessionUseCase;
    }

    @PostMapping
    public ResponseEntity<SessionResponse> creerSession(@Valid @RequestBody CreerSessionRequest request) {
        SessionAcademique session = creerSessionUseCase.creerSession(
                request.annee(), request.dateDebut(), request.dateFin());

        SessionResponse response = new SessionResponse(
                session.getId(), session.getAnnee(), session.getDateDebut(),
                session.getDateFin(), session.getStatut());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}