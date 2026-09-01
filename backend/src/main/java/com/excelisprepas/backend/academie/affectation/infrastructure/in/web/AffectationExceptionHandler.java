package com.excelisprepas.backend.academie.affectation.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import com.excelisprepas.backend.shared.infrastructure.in.web.dto.ApiErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class AffectationExceptionHandler {

    @ExceptionHandler(CentreIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererCentreIntrouvable(CentreIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(FormationIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererFormationIntrouvable(FormationIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SalleIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererSalleIntrouvable(SalleIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MatiereIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererMatiereIntrouvable(MatiereIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(SessionIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererSessionIntrouvable(SessionIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(CreneauDejaPlanifieException.class)
    public ResponseEntity<ApiErrorResponse> gererCreneauDejaPlanifie(CreneauDejaPlanifieException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(SessionNonUtilisableException.class)
    public ResponseEntity<ApiErrorResponse> gererSessionNonUtilisable(SessionNonUtilisableException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(CentreFermeException.class)
    public ResponseEntity<ApiErrorResponse> gererCentreFerme(CentreFermeException ex) {
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

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> gererEtatInvalide(IllegalStateException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(AffectationIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererAffectationIntrouvable(AffectationIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(EnseignantIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererEnseignantIntrouvable(EnseignantIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    private ResponseEntity<ApiErrorResponse> construireReponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(new ApiErrorResponse(statut.value(), statut.getReasonPhrase(), message));
    }
}