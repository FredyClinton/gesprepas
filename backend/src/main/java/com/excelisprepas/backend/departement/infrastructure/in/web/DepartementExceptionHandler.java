package com.excelisprepas.backend.departement.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.DepartementIntrouvableException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class DepartementExceptionHandler {

    @ExceptionHandler(DepartementIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererDepartementIntrouvable(DepartementIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
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