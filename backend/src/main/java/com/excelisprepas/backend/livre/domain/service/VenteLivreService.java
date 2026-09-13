package com.excelisprepas.backend.livre.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.Entree;
import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.livre.domain.model.Livre;
import com.excelisprepas.backend.livre.domain.model.VenteLivre;
import com.excelisprepas.backend.livre.domain.port.in.CalculerStatsVentesLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.in.EnregistrerVenteLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.in.ListerVentesLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.out.LivreRepositoryPort;
import com.excelisprepas.backend.livre.domain.port.out.VenteLivreRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.LivreIndisponibleException;
import com.excelisprepas.backend.shared.exception.LivreIntrouvableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

public class VenteLivreService implements EnregistrerVenteLivreUseCase, ListerVentesLivresUseCase, CalculerStatsVentesLivresUseCase {

    private static final Logger log = LoggerFactory.getLogger(VenteLivreService.class);
    private static final UUID MOTIF_ACHAT_LIVRES_ID = UUID.fromString("00000000-0000-0000-0000-000000000012");

    private final VenteLivreRepositoryPort venteLivreRepositoryPort;
    private final LivreRepositoryPort livreRepositoryPort;
    private final SaisirEntreeUseCase saisirEntreeUseCase;
    private final MotifRepositoryPort motifRepositoryPort;
    private final CentreRepositoryPort centreRepositoryPort;
    private final ApprenantRepositoryPort apprenantRepositoryPort;

    public VenteLivreService(VenteLivreRepositoryPort venteLivreRepositoryPort,
                             LivreRepositoryPort livreRepositoryPort,
                             SaisirEntreeUseCase saisirEntreeUseCase,
                             MotifRepositoryPort motifRepositoryPort,
                             CentreRepositoryPort centreRepositoryPort,
                             ApprenantRepositoryPort apprenantRepositoryPort) {
        this.venteLivreRepositoryPort = venteLivreRepositoryPort;
        this.livreRepositoryPort = livreRepositoryPort;
        this.saisirEntreeUseCase = saisirEntreeUseCase;
        this.motifRepositoryPort = motifRepositoryPort;
        this.centreRepositoryPort = centreRepositoryPort;
        this.apprenantRepositoryPort = apprenantRepositoryPort;
    }

    @Override
    @Transactional
    public List<VenteLivre> enregistrerVente(CommandeVente commande) {
        Objects.requireNonNull(commande, "La commande de vente ne peut pas être nulle");
        if (commande.lignes() == null || commande.lignes().isEmpty()) {
            throw new IllegalArgumentException("La commande doit comporter au moins un livre");
        }

        // Vérification du centre
        Centre centre = centreRepositoryPort.findById(commande.centreId())
                .orElseThrow(() -> new CentreIntrouvableException(commande.centreId()));

        // Détermination du nom de l'acheteur
        String nomAcheteur = commande.nomAcheteur();
        if (commande.apprenantId() != null) {
            Optional<Apprenant> optApprenant = apprenantRepositoryPort.findById(commande.apprenantId());
            if (optApprenant.isPresent()) {
                Apprenant a = optApprenant.get();
                if (nomAcheteur == null || nomAcheteur.isBlank()) {
                    nomAcheteur = a.getNom() + " " + a.getPrenom();
                }
            }
        }
        if (nomAcheteur == null || nomAcheteur.isBlank()) {
            throw new IllegalArgumentException("Le nom de l'acheteur est obligatoire (élève ou externe)");
        }

        // Vérification et décrémentation des stocks des livres
        List<VenteLivre> ventesACreer = new ArrayList<>();
        BigDecimal totalCommande = BigDecimal.ZERO;

        for (LigneVente ligne : commande.lignes()) {
            if (ligne.quantite() <= 0) {
                throw new IllegalArgumentException("La quantité pour chaque livre doit être strictement positive");
            }
            Livre livre = livreRepositoryPort.findById(ligne.livreId())
                    .orElseThrow(() -> new LivreIntrouvableException(ligne.livreId()));

            if (!livre.isActif()) {
                throw new LivreIndisponibleException(livre.getTitre());
            }

            BigDecimal montantLigne = livre.getPrix().multiply(BigDecimal.valueOf(ligne.quantite()));
            totalCommande = totalCommande.add(montantLigne);

            ventesACreer.add(new VenteLivre(
                    UUID.randomUUID(),
                    commande.sessionId(),
                    commande.centreId(),
                    commande.dateVente(),
                    nomAcheteur.trim(),
                    commande.apprenantId(),
                    commande.estExterne(),
                    livre.getId(),
                    ligne.quantite(),
                    livre.getPrix(),
                    montantLigne,
                    null, // entreeId rattaché ci-dessous
                    commande.saisiParUtilisateurId(),
                    null
            ));
        }

        // Enregistrement de l'entrée financière en caisse
        UUID entreeId = null;
        if (saisirEntreeUseCase != null && totalCommande.compareTo(BigDecimal.ZERO) > 0) {
            UUID motifId = resoudreMotifAchatLivres();
            try {
                Entree entree = saisirEntreeUseCase.saisirEntree(
                        commande.sessionId(),
                        motifId,
                        totalCommande,
                        commande.dateVente(),
                        commande.saisiParUtilisateurId(),
                        commande.centreId(),
                        commande.apprenantId(),
                        null
                );
                entreeId = entree.getId();
            } catch (Exception e) {
                log.warn("Impossible d'enregistrer l'entrée financière automatique pour la vente de livre: {}", e.getMessage());
            }
        }

        // Rapprochement avec l'entrée créée
        UUID finalEntreeId = entreeId;
        List<VenteLivre> ventesFinales = ventesACreer.stream().map(v -> new VenteLivre(
                v.getId(),
                v.getSessionId(),
                v.getCentreId(),
                v.getDateVente(),
                v.getNomAcheteur(),
                v.getApprenantId(),
                v.isEstExterne(),
                v.getLivreId(),
                v.getQuantite(),
                v.getPrixUnitaire(),
                v.getMontantTotal(),
                finalEntreeId,
                v.getSaisiParUtilisateurId(),
                v.getCreatedAt()
        )).collect(Collectors.toList());

        List<VenteLivre> sauves = venteLivreRepositoryPort.saveAll(ventesFinales);
        log.info("Vente de {} livre(s) enregistrée pour un total de {} FCFA dans le centre {}",
                commande.lignes().size(), totalCommande, centre.getNom());
        return sauves;
    }

    @Override
    public List<VenteLivre> listerVentes(UUID sessionId, UUID centreId, UUID livreId, LocalDate dateDebut, LocalDate dateFin) {
        Objects.requireNonNull(sessionId, "La session est obligatoire");
        return venteLivreRepositoryPort.findWithFilters(sessionId, centreId, livreId, dateDebut, dateFin);
    }

    @Override
    public StatsVentes calculerStats(UUID sessionId, UUID centreId, LocalDate dateDebut, LocalDate dateFin) {
        Objects.requireNonNull(sessionId, "La session est obligatoire");
        List<VenteLivre> ventes = venteLivreRepositoryPort.findWithFilters(sessionId, centreId, null, dateDebut, dateFin);

        BigDecimal totalMontant = ventes.stream()
                .map(VenteLivre::getMontantTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalQuantite = ventes.stream()
                .mapToInt(VenteLivre::getQuantite)
                .sum();

        // Ventilation par Livre
        List<Livre> tousLesLivres = livreRepositoryPort.findAll();
        Map<UUID, List<VenteLivre>> ventesParLivre = ventes.stream()
                .collect(Collectors.groupingBy(VenteLivre::getLivreId));

        List<VentilationLivre> parLivre = tousLesLivres.stream().map(l -> {
            List<VenteLivre> lignes = ventesParLivre.getOrDefault(l.getId(), Collections.emptyList());
            int qte = lignes.stream().mapToInt(VenteLivre::getQuantite).sum();
            BigDecimal mnt = lignes.stream().map(VenteLivre::getMontantTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
            return new VentilationLivre(l.getId(), l.getTitre(), qte, mnt);
        }).sorted(Comparator.comparingInt(VentilationLivre::quantiteVendue).reversed()
                .thenComparing(VentilationLivre::titreLivre)).collect(Collectors.toList());

        // Ventilation par Centre
        List<Centre> tousLesCentres = centreRepositoryPort.findAll();
        Map<UUID, List<VenteLivre>> ventesParCentre = ventes.stream()
                .collect(Collectors.groupingBy(VenteLivre::getCentreId));

        List<VentilationCentre> parCentre = tousLesCentres.stream()
                .filter(c -> centreId == null || c.getId().equals(centreId))
                .map(c -> {
                    List<VenteLivre> lignes = ventesParCentre.getOrDefault(c.getId(), Collections.emptyList());
                    int qte = lignes.stream().mapToInt(VenteLivre::getQuantite).sum();
                    BigDecimal mnt = lignes.stream().map(VenteLivre::getMontantTotal).reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new VentilationCentre(c.getId(), c.getNom(), qte, mnt);
                }).sorted(Comparator.comparing(VentilationCentre::montantTotal).reversed()
                        .thenComparing(VentilationCentre::nomCentre)).collect(Collectors.toList());

        return new StatsVentes(totalMontant, totalQuantite, parLivre, parCentre);
    }

    private UUID resoudreMotifAchatLivres() {
        if (motifRepositoryPort != null) {
            Optional<Motif> opt = motifRepositoryPort.findById(MOTIF_ACHAT_LIVRES_ID);
            if (opt.isPresent() && opt.get().isActif()) {
                return opt.get().getId();
            }
            List<Motif> motifs = motifRepositoryPort.findAll();
            for (Motif m : motifs) {
                if (m.isActif() && m.getNom().toLowerCase().contains("livre")) {
                    return m.getId();
                }
            }
        }
        return MOTIF_ACHAT_LIVRES_ID;
    }
}

