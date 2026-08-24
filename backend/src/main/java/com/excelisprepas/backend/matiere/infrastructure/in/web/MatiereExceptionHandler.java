package com.excelisprepas.backend.matiere.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.MatiereIntrouvableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class MatiereExceptionHandler {

    @ExceptionHandler(MatiereIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererMatiereIntrouvable(MatiereIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
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
}