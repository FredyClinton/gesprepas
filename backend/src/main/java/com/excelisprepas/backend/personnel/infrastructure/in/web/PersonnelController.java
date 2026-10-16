package com.excelisprepas.backend.personnel.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;
import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.port.in.ConsulterHistoriqueSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.CreerPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.DefinirSalairePersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.ListerPersonnelUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.RecupererPersonnelUseCase;
import com.excelisprepas.backend.personnel.infrastructure.in.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Personnel", description = "Gestion de l'ensemble du personnel et de leurs salaires par session")
@RestController
@RequestMapping("/api/personnel")
public class PersonnelController {

    private final CreerPersonnelUseCase creerPersonnelUseCase;
    private final RecupererPersonnelUseCase recupererPersonnelUseCase;
    private final ListerPersonnelUseCase listerPersonnelUseCase;
    private final DefinirSalairePersonnelUseCase definirSalairePersonnelUseCase;
    private final ConsulterHistoriqueSalairePersonnelUseCase consulterHistoriqueSalairePersonnelUseCase;
    private final com.excelisprepas.backend.personnel.domain.port.in.ModifierPersonnelUseCase modifierPersonnelUseCase;
    private final com.excelisprepas.backend.personnel.domain.port.in.SupprimerPersonnelUseCase supprimerPersonnelUseCase;
    private final com.excelisprepas.backend.personnel.domain.port.in.CreerComptePersonnelUseCase creerComptePersonnelUseCase;

    public PersonnelController(CreerPersonnelUseCase creerPersonnelUseCase,
                               RecupererPersonnelUseCase recupererPersonnelUseCase,
                               ListerPersonnelUseCase listerPersonnelUseCase,
                               DefinirSalairePersonnelUseCase definirSalairePersonnelUseCase,
                               ConsulterHistoriqueSalairePersonnelUseCase consulterHistoriqueSalairePersonnelUseCase,
                               com.excelisprepas.backend.personnel.domain.port.in.ModifierPersonnelUseCase modifierPersonnelUseCase,
                               com.excelisprepas.backend.personnel.domain.port.in.SupprimerPersonnelUseCase supprimerPersonnelUseCase,
                               com.excelisprepas.backend.personnel.domain.port.in.CreerComptePersonnelUseCase creerComptePersonnelUseCase) {
        this.creerPersonnelUseCase = creerPersonnelUseCase;
        this.recupererPersonnelUseCase = recupererPersonnelUseCase;
        this.listerPersonnelUseCase = listerPersonnelUseCase;
        this.definirSalairePersonnelUseCase = definirSalairePersonnelUseCase;
        this.consulterHistoriqueSalairePersonnelUseCase = consulterHistoriqueSalairePersonnelUseCase;
        this.modifierPersonnelUseCase = modifierPersonnelUseCase;
        this.supprimerPersonnelUseCase = supprimerPersonnelUseCase;
        this.creerComptePersonnelUseCase = creerComptePersonnelUseCase;
    }

    @Operation(summary = "Créer un membre du personnel")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @PostMapping
    public ResponseEntity<PersonnelResponse> creer(@Valid @RequestBody CreerPersonnelRequest request) {
        Personnel personnel = creerPersonnelUseCase.creerPersonnel(
                request.nom(), request.prenom(), request.telephone(), request.numeroCni(), request.email());
        return ResponseEntity.status(HttpStatus.CREATED).body(PersonnelResponse.fromDomain(personnel));
    }

    @Operation(summary = "Récupérer un membre du personnel par son identifiant")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @GetMapping("/{id}")
    public ResponseEntity<PersonnelResponse> recuperer(@PathVariable UUID id) {
        Personnel personnel = recupererPersonnelUseCase.recupererPersonnel(id);
        return ResponseEntity.ok(PersonnelResponse.fromDomain(personnel));
    }

    @Operation(summary = "Lister tous les membres du personnel")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @GetMapping
    public ResponseEntity<List<PersonnelResponse>> listerTous() {
        List<PersonnelResponse> list = listerPersonnelUseCase.listerTous().stream()
                .map(PersonnelResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(list);
    }

    @Operation(summary = "Définir ou réviser le salaire d'un personnel pour une session")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @PostMapping("/{personnelId}/sessions/{sessionId}/salaire")
    public ResponseEntity<HistoriqueSalaireResponse> definirSalaire(
            @PathVariable UUID personnelId,
            @PathVariable UUID sessionId,
            @Valid @RequestBody DefinirSalairePersonnelRequest request) {
        HistoriqueSalairePersonnel historique = definirSalairePersonnelUseCase.definirSalaire(
                personnelId, sessionId, request.salaireReference(), request.dateDebutEffet());
        return ResponseEntity.ok(HistoriqueSalaireResponse.fromDomain(historique));
    }

    @Operation(summary = "Consulter l'historique des salaires d'un personnel pour une session")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @GetMapping("/{personnelId}/sessions/{sessionId}/salaire-historique")
    public ResponseEntity<List<HistoriqueSalaireResponse>> consulterHistorique(
            @PathVariable UUID personnelId,
            @PathVariable UUID sessionId) {
        List<HistoriqueSalaireResponse> list = consulterHistoriqueSalairePersonnelUseCase
                .listerParPersonnelEtSession(personnelId, sessionId).stream()
                .map(HistoriqueSalaireResponse::fromDomain)
                .toList();
        return ResponseEntity.ok(list);
    }

    @Operation(summary = "Modifier les coordonnées d'un membre du personnel")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @PutMapping("/{id}")
    public ResponseEntity<PersonnelResponse> modifier(
            @PathVariable UUID id,
            @Valid @RequestBody ModifierPersonnelRequest request) {
        Personnel personnel = modifierPersonnelUseCase.modifierPersonnel(
                id, request.nom(), request.prenom(), request.telephone(), request.numeroCni(), request.email());
        return ResponseEntity.ok(PersonnelResponse.fromDomain(personnel));
    }

    @Operation(summary = "Supprimer un membre du personnel")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable UUID id) {
        supprimerPersonnelUseCase.supprimerPersonnel(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Créer un compte d'accès pour un personnel existant")
    @PreAuthorize("hasAuthority('PERSONNEL_GERER')")
    @PostMapping("/{id}/compte")
    public ResponseEntity<UtilisateurResponse> creerCompte(
            @PathVariable UUID id,
            @Valid @RequestBody CreerComptePersonnelRequest request) {
        com.excelisprepas.backend.personnel.domain.model.Utilisateur utilisateur =
                creerComptePersonnelUseCase.creerCompte(id, request.password(), request.role(), request.centreId());
        return ResponseEntity.status(HttpStatus.CREATED).body(new UtilisateurResponse(
                utilisateur.getId(), utilisateur.getNom(), utilisateur.getPrenom(),
                utilisateur.getTelephone(), utilisateur.getNumeroCni(),
                utilisateur.getEmail(), utilisateur.getRole(), utilisateur.getCentreId(),
                utilisateur.getDepartementId()
        ));
    }
}
