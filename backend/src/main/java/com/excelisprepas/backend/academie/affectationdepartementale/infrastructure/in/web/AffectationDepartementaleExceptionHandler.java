package com.excelisprepas.backend.academie.affectationdepartementale.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import com.excelisprepas.backend.shared.infrastructure.in.web.dto.ApiErrorResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;



@RestControllerAdvice
public class AffectationDepartementaleExceptionHandler {

    @ExceptionHandler(DepartementIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererDepartementIntrouvable(DepartementIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(EnseignantIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererEnseignantIntrouvable(EnseignantIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererSessionIntrouvable(SessionIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(AffectationDepartementaleIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererAffectationDepartementaleIntrouvable(
            AffectationDepartementaleIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionNonUtilisableException.class)
    public ResponseEntity<ApiErrorResponse> gererSessionNonUtilisable(SessionNonUtilisableException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(EnseignantDejaDansRosterException.class)
    public ResponseEntity<ApiErrorResponse> gererEnseignantDejaDansRoster(EnseignantDejaDansRosterException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(EnseignantNonDansRosterSourceException.class)
    public ResponseEntity<ApiErrorResponse> gererEnseignantNonDansRosterSource(
            EnseignantNonDansRosterSourceException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> gererArgumentInvalide(IllegalArgumentException ex) {
        return construireReponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(GestionEnseignantsGeleeException.class)
    public ResponseEntity<ApiErrorResponse> gererGestionEnseignantsGelee(GestionEnseignantsGeleeException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    private ResponseEntity<ApiErrorResponse> construireReponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(new ApiErrorResponse(statut.value(), statut.getReasonPhrase(), message));
    }
}