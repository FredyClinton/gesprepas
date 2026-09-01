package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import com.excelisprepas.backend.shared.infrastructure.in.web.dto.ApiErrorResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;




@RestControllerAdvice
public class PersonnelExceptionHandler {

    @ExceptionHandler(MatriculeDejaUtiliseException.class)
    public ResponseEntity<ApiErrorResponse> gererMatriculeDejaUtilise(MatriculeDejaUtiliseException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(EmailDejaUtiliseException.class)
    public ResponseEntity<ApiErrorResponse> gererEmailDejaUtilise(EmailDejaUtiliseException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(UtilisateurIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererUtilisateurIntrouvable(UtilisateurIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(CentreIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererCentreIntrouvable(CentreIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DepartementIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererDepartementIntrouvable(DepartementIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    private ResponseEntity<ApiErrorResponse> construireReponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(new ApiErrorResponse(statut.value(), statut.getReasonPhrase(), message));
    }

    @ExceptionHandler(EnseignantIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererEnseignantIntrouvable(EnseignantIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> gererEtatInvalide(IllegalStateException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(GestionEnseignantsGeleeException.class)
    public ResponseEntity<ApiErrorResponse> gererGestionEnseignantsGelee(GestionEnseignantsGeleeException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }
}