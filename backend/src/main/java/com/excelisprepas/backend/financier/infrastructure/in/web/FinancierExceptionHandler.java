package com.excelisprepas.backend.financier.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class FinancierExceptionHandler {

    @ExceptionHandler(MotifIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererMotifIntrouvable(MotifIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(CentreIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererCentreIntrouvable(CentreIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ApprenantIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererApprenantIntrouvable(ApprenantIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererSessionIntrouvable(SessionIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionNonUtilisableException.class)
    public ResponseEntity<Map<String, Object>> gererSessionNonUtilisable(SessionNonUtilisableException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MotifInactifException.class)
    public ResponseEntity<Map<String, Object>> gererMotifInactif(MotifInactifException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(MotifTypeIncorrectException.class)
    public ResponseEntity<Map<String, Object>> gererMotifTypeIncorrect(MotifTypeIncorrectException ex) {
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

    @ExceptionHandler(MouvementFinancierIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererMouvementFinancierIntrouvable(MouvementFinancierIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(UtilisateurIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererUtilisateurIntrouvable(UtilisateurIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BilanJournalierIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererBilanJournalierIntrouvable(BilanJournalierIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(BilanJournalierDejaExistantException.class)
    public ResponseEntity<Map<String, Object>> gererBilanJournalierDejaExistant(BilanJournalierDejaExistantException ex) {
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