package com.excelisprepas.backend.livre.infrastructure.in.web;

import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.livre.domain.model.Livre;
import com.excelisprepas.backend.livre.domain.model.VenteLivre;
import com.excelisprepas.backend.livre.domain.port.in.CalculerStatsVentesLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.in.EnregistrerVenteLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.in.ListerVentesLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.out.LivreRepositoryPort;
import com.excelisprepas.backend.livre.infrastructure.in.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Tag(name = "Ventes Livres", description = "Enregistrement, traçabilité et bilans des ventes de livres")
@RestController
@RequestMapping("/api/livres/ventes")
public class VenteLivreController {

    private final EnregistrerVenteLivreUseCase enregistrerVenteLivreUseCase;
    private final ListerVentesLivresUseCase listerVentesLivresUseCase;
    private final CalculerStatsVentesLivresUseCase calculerStatsVentesLivresUseCase;
    private final CentreRepositoryPort centreRepositoryPort;
    private final LivreRepositoryPort livreRepositoryPort;

    public VenteLivreController(EnregistrerVenteLivreUseCase enregistrerVenteLivreUseCase,
                                ListerVentesLivresUseCase listerVentesLivresUseCase,
                                CalculerStatsVentesLivresUseCase calculerStatsVentesLivresUseCase,
                                CentreRepositoryPort centreRepositoryPort,
                                LivreRepositoryPort livreRepositoryPort) {
        this.enregistrerVenteLivreUseCase = enregistrerVenteLivreUseCase;
        this.listerVentesLivresUseCase = listerVentesLivresUseCase;
        this.calculerStatsVentesLivresUseCase = calculerStatsVentesLivresUseCase;
        this.centreRepositoryPort = centreRepositoryPort;
        this.livreRepositoryPort = livreRepositoryPort;
    }

    private UUID filtrerCentreParRole(String userRole, UUID headerCentreId, UUID queryCentreId) {
        if (userRole != null && "CHEF_CENTRE".equalsIgnoreCase(userRole.trim())) {
            if (headerCentreId != null) {
                return headerCentreId;
            }
        }
        return queryCentreId;
    }

    @Operation(summary = "Enregistrer une vente de livres",
               description = "Enregistre la vente d'ouvrages, décrémente les stocks et génère l'entrée en caisse pour le centre.")
    @PostMapping
    public ResponseEntity<List<VenteLivreResponse>> enregistrerVente(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Centre-Id", required = false) UUID userCentreId,
            @Valid @RequestBody EnregistrerVenteLivreRequest request) {

        UUID centreIdEffectif = request.centreId();
        if (userRole != null && "CHEF_CENTRE".equalsIgnoreCase(userRole.trim()) && userCentreId != null) {
            centreIdEffectif = userCentreId;
        }

        List<EnregistrerVenteLivreUseCase.LigneVente> lignes = request.lignes().stream()
                .map(l -> new EnregistrerVenteLivreUseCase.LigneVente(l.livreId(), l.quantite()))
                .toList();

        EnregistrerVenteLivreUseCase.CommandeVente commande = new EnregistrerVenteLivreUseCase.CommandeVente(
                request.sessionId(),
                centreIdEffectif,
                request.dateVente(),
                request.nomAcheteur(),
                request.apprenantId(),
                request.estExterne(),
                request.saisiParUtilisateurId(),
                lignes
        );

        List<VenteLivre> creees = enregistrerVenteLivreUseCase.enregistrerVente(commande);
        return ResponseEntity.status(HttpStatus.CREATED).body(convertir(creees));
    }

    @Operation(summary = "Lister les ventes de livres",
               description = "Historique détaillé des ventes. Le Chef de Centre ne voit que les ventes de son centre.")
    @GetMapping
    public ResponseEntity<List<VenteLivreResponse>> listerVentes(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Centre-Id", required = false) UUID userCentreId,
            @Parameter(description = "Identifiant de la session académique", required = true)
            @RequestParam UUID sessionId,
            @Parameter(description = "Filtre optionnel par centre")
            @RequestParam(required = false) UUID centreId,
            @Parameter(description = "Filtre optionnel par livre")
            @RequestParam(required = false) UUID livreId,
            @Parameter(description = "Date début")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @Parameter(description = "Date fin")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {

        UUID centreFiltre = filtrerCentreParRole(userRole, userCentreId, centreId);
        List<VenteLivre> ventes = listerVentesLivresUseCase.listerVentes(sessionId, centreFiltre, livreId, dateDebut, dateFin);
        return ResponseEntity.ok(convertir(ventes));
    }

    @Operation(summary = "Statistiques et ventilations des ventes",
               description = "Retourne le total, la ventilation par livre et la ventilation par centre pour les bilans.")
    @GetMapping("/stats")
    public ResponseEntity<StatsVentesLivresResponse> getStats(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-Centre-Id", required = false) UUID userCentreId,
            @Parameter(description = "Identifiant de la session académique", required = true)
            @RequestParam UUID sessionId,
            @Parameter(description = "Filtre optionnel par centre")
            @RequestParam(required = false) UUID centreId,
            @Parameter(description = "Date début")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @Parameter(description = "Date fin")
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin) {

        UUID centreFiltre = filtrerCentreParRole(userRole, userCentreId, centreId);
        CalculerStatsVentesLivresUseCase.StatsVentes stats = calculerStatsVentesLivresUseCase.calculerStats(
                sessionId, centreFiltre, dateDebut, dateFin);

        List<StatsVentesLivresResponse.VentilationLivreItem> parLivre = stats.parLivre().stream()
                .map(item -> new StatsVentesLivresResponse.VentilationLivreItem(
                        item.livreId(),
                        item.titreLivre(),
                        item.quantiteVendue(),
                        item.montantTotal()
                )).toList();

        List<StatsVentesLivresResponse.VentilationCentreItem> parCentre = stats.parCentre().stream()
                .map(item -> new StatsVentesLivresResponse.VentilationCentreItem(
                        item.centreId(),
                        item.nomCentre(),
                        item.quantiteVendue(),
                        item.montantTotal()
                )).toList();

        return ResponseEntity.ok(new StatsVentesLivresResponse(
                stats.totalMontant(),
                stats.totalQuantite(),
                parLivre,
                parCentre
        ));
    }

    private List<VenteLivreResponse> convertir(List<VenteLivre> ventes) {
        Map<UUID, String> centresMap = centreRepositoryPort.findAll().stream()
                .collect(Collectors.toMap(Centre::getId, Centre::getNom, (c1, c2) -> c1));

        Map<UUID, String> livresMap = livreRepositoryPort.findAll().stream()
                .collect(Collectors.toMap(Livre::getId, Livre::getTitre, (l1, l2) -> l1));

        return ventes.stream().map(v -> new VenteLivreResponse(
                v.getId(),
                v.getSessionId(),
                v.getCentreId(),
                centresMap.getOrDefault(v.getCentreId(), "Centre inconnu"),
                v.getDateVente(),
                v.getNomAcheteur(),
                v.getApprenantId(),
                v.isEstExterne(),
                v.getLivreId(),
                livresMap.getOrDefault(v.getLivreId(), "Livre"),
                v.getQuantite(),
                v.getPrixUnitaire(),
                v.getMontantTotal(),
                v.getEntreeId(),
                v.getSaisiParUtilisateurId(),
                v.getCreatedAt()
        )).toList();
    }
}

