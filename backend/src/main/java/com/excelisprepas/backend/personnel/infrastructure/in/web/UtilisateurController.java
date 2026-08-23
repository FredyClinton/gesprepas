package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.CreerUtilisateurUseCase;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.CreerUtilisateurRequest;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.UtilisateurResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurController {

    private final CreerUtilisateurUseCase creerUtilisateurUseCase;

    public UtilisateurController(CreerUtilisateurUseCase creerUtilisateurUseCase) {
        this.creerUtilisateurUseCase = creerUtilisateurUseCase;
    }

    @PostMapping
    public ResponseEntity<UtilisateurResponse> creerUtilisateur(@Valid @RequestBody CreerUtilisateurRequest request) {
        Utilisateur utilisateur = creerUtilisateurUseCase.creerUtilisateur(
                request.nom(), request.prenom(), request.email(),
                request.motDePasseClair(), request.role());

        UtilisateurResponse response = new UtilisateurResponse(
                utilisateur.getId(), utilisateur.getNom(), utilisateur.getPrenom(),
                utilisateur.getEmail(), utilisateur.getRole());

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}