package com.excelisprepas.backend.apprenant.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import com.excelisprepas.backend.shared.infrastructure.in.web.dto.ApiErrorResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;



@RestControllerAdvice
public class ApprenantExceptionHandler {

    @ExceptionHandler(CentreIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererCentreIntrouvable(CentreIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(FormationIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererFormationIntrouvable(FormationIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererSessionIntrouvable(SessionIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionNonUtilisableException.class)
    public ResponseEntity<ApiErrorResponse> gererSessionNonUtilisable(SessionNonUtilisableException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(FormationSessionIncoherenteException.class)
    public ResponseEntity<ApiErrorResponse> gererFormationSessionIncoherente(FormationSessionIncoherenteException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> gererArgumentInvalide(IllegalArgumentException ex) {
        return construireReponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(ApprenantIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererApprenantIntrouvable(ApprenantIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    private ResponseEntity<ApiErrorResponse> construireReponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(new ApiErrorResponse(statut.value(), statut.getReasonPhrase(), message));
    }
}