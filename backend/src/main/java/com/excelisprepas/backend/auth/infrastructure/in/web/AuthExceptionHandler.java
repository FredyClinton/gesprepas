package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;
import com.excelisprepas.backend.shared.infrastructure.in.web.dto.ApiErrorResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;



@RestControllerAdvice
public class AuthExceptionHandler {

    @ExceptionHandler(AuthentificationEchoueeException.class)
    public ResponseEntity<ApiErrorResponse> gererAuthentificationEchouee(AuthentificationEchoueeException ex) {
        return construireReponse(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    private ResponseEntity<ApiErrorResponse> construireReponse(HttpStatus statut, String message) {
        return ResponseEntity.status(statut).body(new ApiErrorResponse(statut.value(), statut.getReasonPhrase(), message));
    }
}
