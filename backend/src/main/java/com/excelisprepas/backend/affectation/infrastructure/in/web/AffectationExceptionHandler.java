package com.excelisprepas.backend.affectation.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class AffectationExceptionHandler {

    @ExceptionHandler(CentreIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererCentreIntrouvable(CentreIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(FormationIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererFormationIntrouvable(FormationIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SalleIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererSalleIntrouvable(SalleIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MatiereIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererMatiereIntrouvable(MatiereIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererSessionIntrouvable(SessionIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(CreneauDejaPlanifieException.class)
    public ResponseEntity<Map<String, Object>> gererCreneauDejaPlanifie(CreneauDejaPlanifieException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(SessionNonUtilisableException.class)
    public ResponseEntity<Map<String, Object>> gererSessionNonUtilisable(SessionNonUtilisableException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(FormationSessionIncoherenteException.class)
    public ResponseEntity<Map<String, Object>> gererFormationSessionIncoherente(FormationSessionIncoherenteException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> gererArgumentInvalide(IllegalArgumentException ex) {
        return construireReponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> gererEtatInvalide(IllegalStateException ex) {
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

    @ExceptionHandler(AffectationIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererAffectationIntrouvable(AffectationIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(EnseignantIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererEnseignantIntrouvable(EnseignantIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }
}