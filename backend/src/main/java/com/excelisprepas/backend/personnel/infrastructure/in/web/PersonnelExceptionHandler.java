package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;


@RestControllerAdvice
public class PersonnelExceptionHandler {

    @ExceptionHandler(MatriculeDejaUtiliseException.class)
    public ResponseEntity<Map<String, Object>> gererMatriculeDejaUtilise(MatriculeDejaUtiliseException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(EmailDejaUtiliseException.class)
    public ResponseEntity<Map<String, Object>> gererEmailDejaUtilise(EmailDejaUtiliseException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(UtilisateurIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererUtilisateurIntrouvable(UtilisateurIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(CentreIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererCentreIntrouvable(CentreIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DepartementIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererDepartementIntrouvable(DepartementIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> construireReponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", statut.value(),
                "error", statut.getReasonPhrase(),
                "message", message
        ));
    }

    @ExceptionHandler(EnseignantIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererEnseignantIntrouvable(EnseignantIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> gererEtatInvalide(IllegalStateException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(GestionEnseignantsGeleeException.class)
    public ResponseEntity<Map<String, Object>> gererGestionEnseignantsGelee(GestionEnseignantsGeleeException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }
}