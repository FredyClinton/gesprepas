package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import com.excelisprepas.backend.shared.infrastructure.in.web.dto.ApiErrorResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;



@RestControllerAdvice
public class DossierExceptionHandler {

    @ExceptionHandler(PieceRequiseIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererPieceRequiseIntrouvable(PieceRequiseIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConcoursIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererConcoursIntrouvable(ConcoursIntrouvableException ex) {
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

    @ExceptionHandler(PieceRequiseInactiveException.class)
    public ResponseEntity<ApiErrorResponse> gererPieceRequiseInactive(PieceRequiseInactiveException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(PieceDejaAjouteeAuConcoursException.class)
    public ResponseEntity<ApiErrorResponse> gererPieceDejaAjoutee(PieceDejaAjouteeAuConcoursException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(PieceNonAjouteeAuConcoursException.class)
    public ResponseEntity<ApiErrorResponse> gererPieceNonAjoutee(PieceNonAjouteeAuConcoursException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiErrorResponse> gererArgumentInvalide(IllegalArgumentException ex) {
        return construireReponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiErrorResponse> gererEtatInvalide(IllegalStateException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DossierDejaExistantException.class)
    public ResponseEntity<ApiErrorResponse> gererDossierDejaExistant(DossierDejaExistantException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DossierIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererDossierIntrouvable(DossierIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DossierIntrouvablePourApprenantException.class)
    public ResponseEntity<ApiErrorResponse> gererDossierIntrouvablePourApprenant(DossierIntrouvablePourApprenantException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DossierNonOuvertException.class)
    public ResponseEntity<ApiErrorResponse> gererDossierNonOuvert(DossierNonOuvertException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DossierClotureException.class)
    public ResponseEntity<ApiErrorResponse> gererDossierCloture(DossierClotureException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DossierSansConcoursException.class)
    public ResponseEntity<ApiErrorResponse> gererDossierSansConcours(DossierSansConcoursException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(PiecesNonToutesValideesException.class)
    public ResponseEntity<ApiErrorResponse> gererPiecesNonToutesValidees(PiecesNonToutesValideesException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ConcoursDateLimiteDepasseeException.class)
    public ResponseEntity<ApiErrorResponse> gererConcoursDateLimiteDepassee(ConcoursDateLimiteDepasseeException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ConcoursDejaAjouteAuDossierException.class)
    public ResponseEntity<ApiErrorResponse> gererConcoursDejaAjoute(ConcoursDejaAjouteAuDossierException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DossierConcoursIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererDossierConcoursIntrouvable(DossierConcoursIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(PieceDossierIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererPieceDossierIntrouvable(PieceDossierIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ApprenantIntrouvableException.class)
    public ResponseEntity<ApiErrorResponse> gererApprenantIntrouvable(ApprenantIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    private ResponseEntity<ApiErrorResponse> construireReponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(new ApiErrorResponse(statut.value(), statut.getReasonPhrase(), message));
    }
}