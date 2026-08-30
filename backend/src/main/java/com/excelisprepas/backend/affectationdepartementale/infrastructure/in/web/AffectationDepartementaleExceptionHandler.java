package com.excelisprepas.backend.affectationdepartementale.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class AffectationDepartementaleExceptionHandler {

    @ExceptionHandler(DepartementIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererDepartementIntrouvable(DepartementIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(EnseignantIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererEnseignantIntrouvable(EnseignantIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererSessionIntrouvable(SessionIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(AffectationDepartementaleIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererAffectationDepartementaleIntrouvable(
            AffectationDepartementaleIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionNonUtilisableException.class)
    public ResponseEntity<Map<String, Object>> gererSessionNonUtilisable(SessionNonUtilisableException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(EnseignantDejaDansRosterException.class)
    public ResponseEntity<Map<String, Object>> gererEnseignantDejaDansRoster(EnseignantDejaDansRosterException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(EnseignantNonDansRosterSourceException.class)
    public ResponseEntity<Map<String, Object>> gererEnseignantNonDansRosterSource(
            EnseignantNonDansRosterSourceException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> gererArgumentInvalide(IllegalArgumentException ex) {
        return construireReponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(GestionEnseignantsGeleeException.class)
    public ResponseEntity<Map<String, Object>> gererGestionEnseignantsGelee(GestionEnseignantsGeleeException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
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