package com.excelisprepas.backend.rattachement.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class RattachementExceptionHandler {

    @ExceptionHandler(UtilisateurIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererUtilisateurIntrouvable(UtilisateurIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(CentreIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererCentreIntrouvable(CentreIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererSessionIntrouvable(SessionIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(RattachementIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererRattachementIntrouvable(RattachementIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(AttributionRoleIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererAttributionIntrouvable(AttributionRoleIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionNonUtilisableException.class)
    public ResponseEntity<Map<String, Object>> gererSessionNonUtilisable(SessionNonUtilisableException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(CentreNonParticipantSessionException.class)
    public ResponseEntity<Map<String, Object>> gererCentreNonParticipant(CentreNonParticipantSessionException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(RattachementDejaExistantException.class)
    public ResponseEntity<Map<String, Object>> gererRattachementDejaExistant(RattachementDejaExistantException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(RoleNonCentreScopeException.class)
    public ResponseEntity<Map<String, Object>> gererRoleNonCentreScope(RoleNonCentreScopeException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(RattachementRequisException.class)
    public ResponseEntity<Map<String, Object>> gererRattachementRequis(RattachementRequisException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(RoleDejaAttribueException.class)
    public ResponseEntity<Map<String, Object>> gererRoleDejaAttribue(RoleDejaAttribueException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> gererArgumentInvalide(IllegalArgumentException ex) {
        return construireReponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> construireReponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", statut.value(),
                "error", statut.getReasonPhrase(),
                "message", message
        ));
    }
}