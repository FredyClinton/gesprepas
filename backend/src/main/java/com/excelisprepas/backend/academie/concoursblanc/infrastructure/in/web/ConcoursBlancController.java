package com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.ConcoursBlanc;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.EpreuveConcoursBlanc;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.NoteEpreuve;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.ResultatCandidat;
import com.excelisprepas.backend.academie.concoursblanc.domain.service.ConcoursBlancService;
import com.excelisprepas.backend.academie.concoursblanc.infrastructure.in.web.dto.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@RestController
@RequestMapping("/api/concours-blancs")
public class ConcoursBlancController {

    private final ConcoursBlancService concoursBlancService;
    private final DepartementRepositoryPort departementRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final com.excelisprepas.backend.academie.etablissement.domain.port.out.EtablissementRepositoryPort etablissementRepository;

    public ConcoursBlancController(ConcoursBlancService concoursBlancService,
                                  DepartementRepositoryPort departementRepository,
                                  ApprenantRepositoryPort apprenantRepository,
                                  @org.springframework.beans.factory.annotation.Autowired(required = false)
                                  com.excelisprepas.backend.academie.etablissement.domain.port.out.EtablissementRepositoryPort etablissementRepository) {
        this.concoursBlancService = concoursBlancService;
        this.departementRepository = departementRepository;
        this.apprenantRepository = apprenantRepository;
        this.etablissementRepository = etablissementRepository;
    }

    @PostMapping
    public ResponseEntity<ConcoursBlancResponse> creer(@Valid @RequestBody CreerConcoursBlancRequest request) {
        List<ConcoursBlancService.EpreuveParam> params = request.epreuves() != null
                ? request.epreuves().stream().map(e -> new ConcoursBlancService.EpreuveParam(
                e.formationId(),
                e.matiereId(),
                e.intitule(),
                e.dureeMinutes(),
                e.noteMax(),
                e.coefficient()
        )).collect(Collectors.toList())
                : List.of();

        ConcoursBlanc cb = concoursBlancService.creerConcoursBlanc(
                request.sessionId(),
                request.titre(),
                request.numero(),
                request.dateEpreuve(),
                request.jour(),
                request.semaine(),
                request.seanceDebut(),
                request.seanceFin(),
                request.tousLesCentres() != null ? request.tousLesCentres() : true,
                request.centreIds(),
                params
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(ConcoursBlancResponse.fromDomain(cb));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConcoursBlancResponse> modifier(
            @PathVariable UUID id,
            @Valid @RequestBody ModifierConcoursBlancRequest request) {
        List<ConcoursBlancService.EpreuveParam> params = request.epreuves() != null
                ? request.epreuves().stream().map(e -> new ConcoursBlancService.EpreuveParam(
                e.formationId(),
                e.matiereId(),
                e.intitule(),
                e.dureeMinutes(),
                e.noteMax(),
                e.coefficient()
        )).collect(Collectors.toList())
                : List.of();

        ConcoursBlanc cb = concoursBlancService.modifierConcoursBlanc(
                id,
                request.titre(),
                request.numero(),
                request.dateEpreuve(),
                request.jour(),
                request.semaine(),
                request.seanceDebut(),
                request.seanceFin(),
                request.tousLesCentres() != null ? request.tousLesCentres() : true,
                request.centreIds(),
                params
        );

        return ResponseEntity.ok(ConcoursBlancResponse.fromDomain(cb));
    }

    private boolean estUtilisateurDirection(String userRole) {
        if (userRole == null) return false;
        String r = userRole.trim().toUpperCase();
        return "DIRECTEUR".equals(r) || "DIRECTEUR_ACADEMIQUE".equals(r);
    }

    private void verifierAccesCentre(ConcoursBlanc cb, String userRole, String centreIdHeader) {
        if (estUtilisateurDirection(userRole)) return;
        if (centreIdHeader == null || centreIdHeader.isBlank()) return;
        try {
            UUID centreId = UUID.fromString(centreIdHeader.trim());
            boolean concerne = cb.isTousLesCentres() || (cb.getCentreIds() != null && cb.getCentreIds().contains(centreId));
            if (!concerne) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce concours blanc ne concerne pas votre centre.");
            }
        } catch (IllegalArgumentException ignored) {
        }
    }

    @GetMapping
    public ResponseEntity<List<ConcoursBlancResponse>> lister(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Centre-Id", required = false) String centreIdHeader,
            @RequestParam UUID sessionId) {
        List<ConcoursBlanc> list = concoursBlancService.listerParSession(sessionId);
        if (!estUtilisateurDirection(userRole) && centreIdHeader != null && !centreIdHeader.isBlank()) {
            try {
                UUID centreId = UUID.fromString(centreIdHeader.trim());
                list = list.stream()
                        .filter(cb -> cb.isTousLesCentres() || (cb.getCentreIds() != null && cb.getCentreIds().contains(centreId)))
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException ignored) {
            }
        }
        return ResponseEntity.ok(list.stream().map(ConcoursBlancResponse::fromDomain).collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ConcoursBlancResponse> recuperer(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Centre-Id", required = false) String centreIdHeader,
            @PathVariable UUID id) {
        ConcoursBlanc cb = concoursBlancService.recupererParId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Concours blanc non trouvé"));
        verifierAccesCentre(cb, userRole, centreIdHeader);
        return ResponseEntity.ok(ConcoursBlancResponse.fromDomain(cb));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable UUID id) {
        concoursBlancService.supprimerConcoursBlanc(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/epreuves/{epreuveId}/contenu")
    public ResponseEntity<EpreuveResponse> definirContenu(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Departement-Id", required = false) String departementIdHeader,
            @PathVariable UUID id,
            @PathVariable UUID epreuveId,
            @RequestBody DefinirContenuEpreuveRequest request) {

        if (userRole != null && !userRole.isBlank()) {
            String roleUpper = userRole.trim().toUpperCase();
            if ("CHEF_CENTRE".equals(roleUpper) || "CAISSIER".equals(roleUpper) ||
                "COMPTABLE".equals(roleUpper) || "CHARGE_DOSSIER".equals(roleUpper)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Seuls les chefs de département et la direction académique peuvent définir le contenu des épreuves.");
            }
            if ("CHEF_DEPARTEMENT".equals(roleUpper)) {
                if (departementIdHeader != null && !departementIdHeader.isBlank()) {
                    try {
                        UUID depId = UUID.fromString(departementIdHeader.trim());
                        var depOpt = departementRepository.findById(depId);
                        if (depOpt.isPresent()) {
                            var dep = depOpt.get();
                            EpreuveConcoursBlanc ep = concoursBlancService.recupererEpreuve(epreuveId)
                                     .orElseThrow(() -> new IllegalArgumentException("Épreuve introuvable"));
                            if (!dep.getMatiereId().equals(ep.getMatiereId())) {
                                throw new ResponseStatusException(
                                        HttpStatus.FORBIDDEN, "Un chef de département ne peut définir que le contenu des épreuves de sa propre matière.");
                            }
                        }
                    } catch (IllegalArgumentException ex) {
                        // ignore invalid UUID parsing
                    }
                }
            }
        }

        EpreuveConcoursBlanc ep = concoursBlancService.definirContenuEpreuve(id, epreuveId, request.contenuEvaluation(), request.consignes());
        return ResponseEntity.ok(EpreuveResponse.fromDomain(ep));
    }

    @PutMapping("/{id}/statut")
    public ResponseEntity<ConcoursBlancResponse> changerStatut(
            @PathVariable UUID id,
            @Valid @RequestBody ChangerStatutRequest request) {
        ConcoursBlanc cb = concoursBlancService.changerStatut(id, request.statut());
        return ResponseEntity.ok(ConcoursBlancResponse.fromDomain(cb));
    }

    @PutMapping("/{id}/verrouiller-centres")
    public ResponseEntity<ConcoursBlancResponse> verrouillerCentres(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable UUID id,
            @RequestParam boolean bloquer) {
        if (!estUtilisateurDirection(userRole)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Seule la direction académique peut verrouiller ou déverrouiller la saisie des notes pour les centres.");
        }
        ConcoursBlanc cb = concoursBlancService.basculerVerrouillageSaisieCentres(id, bloquer);
        return ResponseEntity.ok(ConcoursBlancResponse.fromDomain(cb));
    }

    @PostMapping("/{id}/compiler")
    public ResponseEntity<Void> compilerResultats(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @PathVariable UUID id) {
        if (!estUtilisateurDirection(userRole)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Seule la direction académique peut déclencher la compilation des résultats.");
        }
        concoursBlancService.compilerResultats(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/resultats")
    public ResponseEntity<List<ResultatCandidatResponse>> recupererResultats(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Centre-Id", required = false) String centreIdHeader,
            @PathVariable UUID id,
            @RequestParam(required = false) UUID centreId,
            @RequestParam(required = false) UUID formationId) {
        ConcoursBlanc cb = concoursBlancService.recupererParId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Concours blanc non trouvé"));
        verifierAccesCentre(cb, userRole, centreIdHeader);

        UUID filtreCentre = centreId;
        if (!estUtilisateurDirection(userRole) && centreIdHeader != null && !centreIdHeader.isBlank()) {
            filtreCentre = UUID.fromString(centreIdHeader.trim());
        }

        List<ResultatCandidat> list = concoursBlancService.recupererResultats(id, filtreCentre, formationId);
        for (ResultatCandidat r : list) {
            if ((r.getEtablissementOrigine() == null || r.getEtablissementOrigine().isBlank()) && r.getApprenantId() != null) {
                apprenantRepository.findById(r.getApprenantId()).ifPresent(a -> r.setEtablissementOrigine(a.getEtablissementOrigine()));
            }
        }
        return ResponseEntity.ok(list.stream().map(ResultatCandidatResponse::fromDomain).collect(Collectors.toList()));
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<List<ResultatCandidatResponse>> enregistrerNotes(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Centre-Id", required = false) String centreIdHeader,
            @PathVariable UUID id,
            @Valid @RequestBody EnregistrerNotesRequest request) {

        if (userRole != null && "CHEF_DEPARTEMENT".equalsIgnoreCase(userRole.trim())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Les chefs de département ne sont pas autorisés à saisir les notes des concours blancs.");
        }

        ConcoursBlanc cb = concoursBlancService.recupererParId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Concours blanc non trouvé"));
        verifierAccesCentre(cb, userRole, centreIdHeader);

        // Si le concours blanc est définitivement clôturé, interdire toute saisie
        if (cb.getStatut() == com.excelisprepas.backend.academie.concoursblanc.domain.model.StatutConcoursBlanc.CLOTURE) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Ce concours blanc est définitivement clôturé. La saisie des notes est fermée.");
        }

        // Si la saisie a été bloquée pour les centres par le DA, refuser tout accès non-DA
        if (cb.isSaisieNotesBloqueeCentre() && !estUtilisateurDirection(userRole)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "La saisie des notes a été verrouillée pour les centres par la Direction Académique.");
        }

        if (!estUtilisateurDirection(userRole) && centreIdHeader != null && !centreIdHeader.isBlank()) {
            try {
                UUID userCentreId = UUID.fromString(centreIdHeader.trim());
                if (!userCentreId.equals(request.centreId())) {
                    throw new ResponseStatusException(
                            HttpStatus.FORBIDDEN, "Vous ne pouvez saisir des notes que pour votre propre centre.");
                }
            } catch (IllegalArgumentException ignored) {
            }
        }

        List<ResultatCandidat> domainList = request.candidats().stream().map(c -> {
            UUID resId = c.id() != null ? c.id() : UUID.randomUUID();
            List<NoteEpreuve> notes = c.notes() != null
                    ? c.notes().stream().map(n -> new NoteEpreuve(n.epreuveId(), n.note(), n.statut())).collect(Collectors.toList())
                    : List.of();

            String etablissement = c.etablissementOrigine();
            if ((etablissement == null || etablissement.isBlank()) && c.apprenantId() != null) {
                etablissement = apprenantRepository.findById(c.apprenantId())
                        .map(Apprenant::getEtablissementOrigine)
                        .orElse(null);
            }

            if (etablissementRepository != null && etablissement != null && !etablissement.isBlank()) {
                String nomNettoye = etablissement.trim();
                try {
                    if (etablissementRepository.findByNomIgnoreCase(nomNettoye).isEmpty()) {
                        etablissementRepository.save(new com.excelisprepas.backend.academie.etablissement.domain.model.Etablissement(
                                UUID.randomUUID(), nomNettoye, null
                        ));
                    }
                } catch (Exception ignored) {}
            }

            return new ResultatCandidat(
                    resId,
                    id,
                    c.formationId(),
                    request.centreId(),
                    c.apprenantId(),
                    c.nomComplet(),
                    etablissement,
                    c.horsListe(),
                    notes
            );
        }).collect(Collectors.toList());

        List<ResultatCandidat> saved = concoursBlancService.enregistrerNotes(id, request.centreId(), domainList);
        return ResponseEntity.ok(saved.stream().map(ResultatCandidatResponse::fromDomain).collect(Collectors.toList()));
    }

    @GetMapping("/{id}/bordereau")
    public ResponseEntity<BordereauResponse> recupererBordereau(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Centre-Id", required = false) String centreIdHeader,
            @PathVariable UUID id,
            @RequestParam UUID formationId,
            @RequestParam(required = false) UUID centreId) {
        ConcoursBlanc cb = concoursBlancService.recupererParId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Concours blanc non trouvé"));
        verifierAccesCentre(cb, userRole, centreIdHeader);

        UUID filtreCentre = centreId;
        if (!estUtilisateurDirection(userRole) && centreIdHeader != null && !centreIdHeader.isBlank()) {
            filtreCentre = UUID.fromString(centreIdHeader.trim());
        }

        List<EpreuveResponse> epreuvesFormation = cb.getEpreuves().stream()
                .filter(e -> e.getFormationId().equals(formationId))
                .map(EpreuveResponse::fromDomain)
                .collect(Collectors.toList());

        Map<UUID, BigDecimal> meilleuresNotes = concoursBlancService.trouverMeilleuresNotesParEpreuve(id, formationId);

        List<ResultatCandidat> resultats = concoursBlancService.recupererResultats(id, filtreCentre, formationId);
        for (ResultatCandidat r : resultats) {
            if ((r.getEtablissementOrigine() == null || r.getEtablissementOrigine().isBlank()) && r.getApprenantId() != null) {
                apprenantRepository.findById(r.getApprenantId()).ifPresent(a -> r.setEtablissementOrigine(a.getEtablissementOrigine()));
            }
        }
        List<ResultatCandidatResponse> candidats = resultats.stream()
                .map(ResultatCandidatResponse::fromDomain)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new BordereauResponse(
                ConcoursBlancResponse.fromDomain(cb),
                formationId,
                epreuvesFormation,
                meilleuresNotes,
                candidats
        ));
    }
}

