package com.excelisprepas.backend.dossier.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class DossierExceptionHandler {

    @ExceptionHandler(PieceRequiseIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererPieceRequiseIntrouvable(PieceRequiseIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ConcoursIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererConcoursIntrouvable(ConcoursIntrouvableException ex) {
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

    @ExceptionHandler(PieceRequiseInactiveException.class)
    public ResponseEntity<Map<String, Object>> gererPieceRequiseInactive(PieceRequiseInactiveException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(PieceDejaAjouteeAuConcoursException.class)
    public ResponseEntity<Map<String, Object>> gererPieceDejaAjoutee(PieceDejaAjouteeAuConcoursException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(PieceNonAjouteeAuConcoursException.class)
    public ResponseEntity<Map<String, Object>> gererPieceNonAjoutee(PieceNonAjouteeAuConcoursException ex) {
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

    @ExceptionHandler(DossierDejaExistantException.class)
    public ResponseEntity<Map<String, Object>> gererDossierDejaExistant(DossierDejaExistantException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DossierIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererDossierIntrouvable(DossierIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DossierIntrouvablePourApprenantException.class)
    public ResponseEntity<Map<String, Object>> gererDossierIntrouvablePourApprenant(DossierIntrouvablePourApprenantException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(DossierNonOuvertException.class)
    public ResponseEntity<Map<String, Object>> gererDossierNonOuvert(DossierNonOuvertException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DossierClotureException.class)
    public ResponseEntity<Map<String, Object>> gererDossierCloture(DossierClotureException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DossierSansConcoursException.class)
    public ResponseEntity<Map<String, Object>> gererDossierSansConcours(DossierSansConcoursException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(PiecesNonToutesValideesException.class)
    public ResponseEntity<Map<String, Object>> gererPiecesNonToutesValidees(PiecesNonToutesValideesException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ConcoursDateLimiteDepasseeException.class)
    public ResponseEntity<Map<String, Object>> gererConcoursDateLimiteDepassee(ConcoursDateLimiteDepasseeException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(ConcoursDejaAjouteAuDossierException.class)
    public ResponseEntity<Map<String, Object>> gererConcoursDejaAjoute(ConcoursDejaAjouteAuDossierException ex) {
        return construireReponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    @ExceptionHandler(DossierConcoursIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererDossierConcoursIntrouvable(DossierConcoursIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(PieceDossierIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererPieceDossierIntrouvable(PieceDossierIntrouvableException ex) {
        return construireReponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(ApprenantIntrouvableException.class)
    public ResponseEntity<Map<String, Object>> gererApprenantIntrouvable(ApprenantIntrouvableException ex) {
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
}