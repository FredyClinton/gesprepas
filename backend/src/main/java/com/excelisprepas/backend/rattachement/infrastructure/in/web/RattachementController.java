package com.excelisprepas.backend.rattachement.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;
import com.excelisprepas.backend.rattachement.domain.port.in.*;
import com.excelisprepas.backend.rattachement.infrastructure.in.web.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/rattachements")
public class RattachementController {

    private final RattacherUtilisateurUseCase rattacherUtilisateurUseCase;
    private final AffecterCentreUseCase affecterCentreUseCase;
    private final AjouterRoleUseCase ajouterRoleUseCase;
    private final RetirerRoleUseCase retirerRoleUseCase;
    private final RecupererRattachementUseCase recupererRattachementUseCase;
    private final ListerRattachementsUseCase listerRattachementsUseCase;
    private final ListerRolesUseCase listerRolesUseCase;
    private final SupprimerRattachementUseCase supprimerRattachementUseCase;

    public RattachementController(RattacherUtilisateurUseCase rattacherUtilisateurUseCase,
                                  AffecterCentreUseCase affecterCentreUseCase,
                                  AjouterRoleUseCase ajouterRoleUseCase,
                                  RetirerRoleUseCase retirerRoleUseCase,
                                  RecupererRattachementUseCase recupererRattachementUseCase,
                                  ListerRattachementsUseCase listerRattachementsUseCase,
                                  ListerRolesUseCase listerRolesUseCase,
                                  SupprimerRattachementUseCase supprimerRattachementUseCase) {
        this.rattacherUtilisateurUseCase = rattacherUtilisateurUseCase;
        this.affecterCentreUseCase = affecterCentreUseCase;
        this.ajouterRoleUseCase = ajouterRoleUseCase;
        this.retirerRoleUseCase = retirerRoleUseCase;
        this.recupererRattachementUseCase = recupererRattachementUseCase;
        this.listerRattachementsUseCase = listerRattachementsUseCase;
        this.listerRolesUseCase = listerRolesUseCase;
        this.supprimerRattachementUseCase = supprimerRattachementUseCase;
    }

    private static RattachementResponse versReponse(RattachementCentre rattachement) {
        return new RattachementResponse(
                rattachement.getId(), rattachement.getUtilisateurId(),
                rattachement.getSessionId(), rattachement.getCentreId());
    }

    private static AttributionRoleResponse versReponse(AttributionRole attribution) {
        return new AttributionRoleResponse(
                attribution.getId(), attribution.getUtilisateurId(), attribution.getSessionId(), attribution.getRole());
    }

    @PostMapping
    public ResponseEntity<RattachementResponse> rattacher(@Valid @RequestBody RattacherRequest request) {
        RattachementCentre rattachement = rattacherUtilisateurUseCase.rattacher(
                request.utilisateurId(), request.sessionId(), request.centreId(), request.rolesInitiaux());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(rattachement));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RattachementResponse> recuperer(@PathVariable UUID id) {
        return ResponseEntity.ok(versReponse(recupererRattachementUseCase.recuperer(id)));
    }

    @GetMapping
    public ResponseEntity<List<RattachementResponse>> lister(
            @RequestParam UUID centreId, @RequestParam UUID sessionId) {
        List<RattachementResponse> reponses = listerRattachementsUseCase
                .listerParCentreEtSession(centreId, sessionId).stream()
                .map(RattachementController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }

    @PatchMapping("/{id}/affecter")
    public ResponseEntity<RattachementResponse> affecter(@PathVariable UUID id,
                                                         @Valid @RequestBody AffecterCentreRequest request) {
        RattachementCentre rattachement = affecterCentreUseCase.affecter(
                id, request.centreId(), request.nouveauxRoles());
        return ResponseEntity.ok(versReponse(rattachement));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable UUID id) {
        supprimerRattachementUseCase.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/roles")
    public ResponseEntity<AttributionRoleResponse> ajouterRole(@Valid @RequestBody AjouterRoleRequest request) {
        AttributionRole attribution = ajouterRoleUseCase.ajouterRole(
                request.utilisateurId(), request.sessionId(), request.role());
        return ResponseEntity.status(HttpStatus.CREATED).body(versReponse(attribution));
    }

    @DeleteMapping("/roles")
    public ResponseEntity<Void> retirerRole(
            @RequestParam UUID utilisateurId, @RequestParam UUID sessionId, @RequestParam RoleUtilisateur role) {
        retirerRoleUseCase.retirerRole(utilisateurId, sessionId, role);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/roles")
    public ResponseEntity<List<AttributionRoleResponse>> listerRoles(
            @RequestParam UUID utilisateurId, @RequestParam UUID sessionId) {
        List<AttributionRoleResponse> reponses = listerRolesUseCase
                .listerParUtilisateurEtSession(utilisateurId, sessionId).stream()
                .map(RattachementController::versReponse)
                .toList();
        return ResponseEntity.ok(reponses);
    }
}