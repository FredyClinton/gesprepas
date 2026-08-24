package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/utilisateurs")
public class UtilisateurController {

    private final CreerUtilisateurUseCase creerUtilisateurUseCase;
    private final RecupererUtilisateurUseCase recupererUtilisateurUseCase;
    private final ListerUtilisateursUseCase listerUtilisateursUseCase;
    private final ChangerEmailUseCase changerEmailUseCase;
    private final ChangerMotDePasseUseCase changerMotDePasseUseCase;
    private final RattacherCentreUseCase rattacherCentreUseCase;
    private final DetacherCentreUseCase detacherCentreUseCase;
    private final SupprimerUtilisateurUseCase supprimerUtilisateurUseCase;

    public UtilisateurController(CreerUtilisateurUseCase creerUtilisateurUseCase,
                                 RecupererUtilisateurUseCase recupererUtilisateurUseCase,
                                 ListerUtilisateursUseCase listerUtilisateursUseCase,
                                 ChangerEmailUseCase changerEmailUseCase,
                                 ChangerMotDePasseUseCase changerMotDePasseUseCase,
                                 RattacherCentreUseCase rattacherCentreUseCase,
                                 DetacherCentreUseCase detacherCentreUseCase,
                                 SupprimerUtilisateurUseCase supprimerUtilisateurUseCase) {
        this.creerUtilisateurUseCase = creerUtilisateurUseCase;
        this.recupererUtilisateurUseCase = recupererUtilisateurUseCase;
        this.listerUtilisateursUseCase = listerUtilisateursUseCase;
        this.changerEmailUseCase = changerEmailUseCase;
        this.changerMotDePasseUseCase = changerMotDePasseUseCase;
        this.rattacherCentreUseCase = rattacherCentreUseCase;
        this.detacherCentreUseCase = detacherCentreUseCase;
        this.supprimerUtilisateurUseCase = supprimerUtilisateurUseCase;
    }

    private static UtilisateurResponse versReponse(Utilisateur utilisateur) {
        return new UtilisateurResponse(
                utilisateur.getId(), utilisateur.getNom(), utilisateur.getPrenom(),
                utilisateur.getEmail(), utilisateur.getRole(), utilisateur.getCentreId());
    }

    @PostMapping
    public ResponseEntity<UtilisateurResponse> creerUtilisateur(@Valid @RequestBody CreerUtilisateurRequest request) {
        Utilisateur utilisateur = creerUtilisateurUseCase.creerUtilisateur(
                request.nom(), request.prenom(), request.email(),
                request.motDePasseClair(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(utilisateur));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UtilisateurResponse> recupererUtilisateur(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererUtilisateurUseCase.recupererUtilisateur(id)));
    }

    @GetMapping
    public ResponseEntity<List<UtilisateurResponse>> listerUtilisateurs() {
        List<UtilisateurResponse> reponses = listerUtilisateursUseCase.listerUtilisateurs().stream()
                .map(UtilisateurController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/email")
    public ResponseEntity<UtilisateurResponse> changerEmail(@PathVariable UUID id,
                                                            @Valid @RequestBody ChangerEmailRequest request) {
        return ResponseEntity.ok(versReponse(changerEmailUseCase.changerEmail(id, request.email())));
    }

    @PatchMapping("/{id}/mot-de-passe")
    public ResponseEntity<Void> changerMotDePasse(@PathVariable UUID id,
                                                  @Valid @RequestBody ChangerMotDePasseRequest request) {
        changerMotDePasseUseCase.changerMotDePasse(id, request.motDePasseClair());
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/rattacher-centre")
    public ResponseEntity<UtilisateurResponse> rattacherCentre(@PathVariable UUID id,
                                                               @Valid @RequestBody RattacherCentreRequest request) {
        return ResponseEntity.ok(versReponse(rattacherCentreUseCase.rattacherCentre(id, request.centreId())));
    }

    @PatchMapping("/{id}/detacher-centre")
    public ResponseEntity<UtilisateurResponse> detacherCentre(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(detacherCentreUseCase.detacherCentre(id)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerUtilisateur(@PathVariable UUID id) {
        supprimerUtilisateurUseCase.supprimerUtilisateur(id);
        return ResponseEntity.noContent().build();
    }
}