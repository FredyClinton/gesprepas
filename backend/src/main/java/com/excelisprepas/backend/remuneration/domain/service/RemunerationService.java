package com.excelisprepas.backend.remuneration.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutPaiement;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.HistoriqueTarifEnseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueTarifRepositoryPort;
import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;
import com.excelisprepas.backend.remuneration.domain.model.FichePaieEnseignant;
import com.excelisprepas.backend.remuneration.domain.model.LigneDecompteSeance;
import com.excelisprepas.backend.remuneration.domain.model.TypeLigneDecompte;
import com.excelisprepas.backend.remuneration.domain.port.in.PreparerBordereauPaieUseCase;
import com.excelisprepas.backend.remuneration.domain.port.in.ValiderBordereauPaieUseCase;
import com.excelisprepas.backend.remuneration.domain.port.out.BordereauPaieRepositoryPort;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

public class RemunerationService implements PreparerBordereauPaieUseCase, ValiderBordereauPaieUseCase {

    private final AffectationRepositoryPort affectationRepository;
    private final EnseignantRepositoryPort enseignantRepository;
    private final HistoriqueTarifRepositoryPort historiqueTarifRepository;
    private final BordereauPaieRepositoryPort bordereauPaieRepository;
    private final SaisirSortieUseCase saisirSortieUseCase;
    
    // Le UUID du motif "Rémunération Enseignant" (idéalement injecté ou recherché)
    private final UUID motifRemunerationId = UUID.fromString("00000000-0000-0000-0000-000000000001"); // TODO: Use real motif

    public RemunerationService(AffectationRepositoryPort affectationRepository,
                               EnseignantRepositoryPort enseignantRepository,
                               HistoriqueTarifRepositoryPort historiqueTarifRepository,
                               BordereauPaieRepositoryPort bordereauPaieRepository,
                               SaisirSortieUseCase saisirSortieUseCase) {
        this.affectationRepository = affectationRepository;
        this.enseignantRepository = enseignantRepository;
        this.historiqueTarifRepository = historiqueTarifRepository;
        this.bordereauPaieRepository = bordereauPaieRepository;
        this.saisirSortieUseCase = saisirSortieUseCase;
    }

    @Override
    public BordereauPaie preparerDecompte(UUID sessionId, LocalDate datePaiement, String saisiPar) {
        // 1. Récupérer toutes les séances effectuées non payées
        List<Affectation> seances = affectationRepository.findBySessionIdAndStatutAndStatutPaiement(
                sessionId, StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE);

        // 2. Grouper par enseignant
        Map<UUID, List<Affectation>> seancesParEnseignant = seances.stream()
                .collect(Collectors.groupingBy(Affectation::getEnseignantId));

        List<FichePaieEnseignant> fiches = new ArrayList<>();
        UUID bordereauId = UUID.randomUUID();

        // 3. Calculer les fiches individuelles
        for (Map.Entry<UUID, List<Affectation>> entry : seancesParEnseignant.entrySet()) {
            UUID enseignantId = entry.getKey();
            List<Affectation> affectations = entry.getValue();

            Enseignant enseignant = enseignantRepository.findById(enseignantId)
                    .orElseThrow(() -> new IllegalStateException("Enseignant introuvable: " + enseignantId));

            List<LigneDecompteSeance> lignes = new ArrayList<>();

            for (Affectation aff : affectations) {
                // Chercher le tarif historique pour la période de la séance
                Optional<HistoriqueTarifEnseignant> tarifHist = historiqueTarifRepository
                        .findTarifApplicable(enseignantId, sessionId, aff.getSemaine());

                BigDecimal tarifApplique = tarifHist.map(HistoriqueTarifEnseignant::getCoutParSeance)
                        .orElse(enseignant.getCoutParSeance());

                // TODO: Determine if it's a regularisation or normal based on current week
                TypeLigneDecompte type = TypeLigneDecompte.NORMALE; 
                lignes.add(new LigneDecompteSeance(aff.getId(), aff.getSemaine(), aff.getJour(), tarifApplique, type));
            }

            fiches.add(new FichePaieEnseignant(UUID.randomUUID(), bordereauId, enseignantId, lignes));
        }

        // On n'a pas encore de Sortie financière (on mettra un UUID bidon ou on gère nullable)
        return new BordereauPaie(bordereauId, sessionId, "BORD-" + LocalDate.now().toString(), datePaiement, fiches, UUID.randomUUID(), saisiPar);
    }

    @Override
    public BordereauPaie valider(BordereauPaie bordereauSimule) {
        // 1. Créer la sortie financière globale
        // Normalement, SaisirSortieUseCase attend le centreId, ici c'est global, on peut bypasser si le UseCase le permet.
        // Si SaisirSortieUseCase requiert un centreId, il faudra adapter l'interface de SaisirSortieUseCase ou créer un MouvementFinancier direct.
        // Pour ce POC, on simule une création de sortie
        
        UUID motifRemunerationId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        // We assume "saisiPar" might contain an ID or we pass a generic system user ID. For POC we pass random.
        UUID systemUserId = UUID.randomUUID();
        
        Sortie sortie = saisirSortieUseCase.saisirSortie(
                bordereauSimule.getSessionId(),
                motifRemunerationId,
                bordereauSimule.getMontantTotalGlobal(),
                bordereauSimule.getDatePaiement(),
                systemUserId,
                null, // centreId = null car c'est global
                bordereauSimule.getSaisiPar() // ordonnateur
        );
        UUID sortieId = sortie.getId();
 
        
        // SaisirSortieUseCase dans le projet requiert:
        // Sortie saisirSortie(RoleUtilisateur appelant, UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date, String ordonnateur, UUID centreId)
        // Ici on suppose que le système gère les sorties globales en passant null comme centreId.

        // Reconstruire le bordereau avec la vraie sortieId
        BordereauPaie bordereauValide = BordereauPaie.reconstituer(
                bordereauSimule.getId(), bordereauSimule.getSessionId(), bordereauSimule.getReference(),
                bordereauSimule.getDatePaiement(), bordereauSimule.getFiches(),
                bordereauSimule.getNombreTotalEnseignants(), bordereauSimule.getNombreTotalSeances(),
                bordereauSimule.getMontantTotalGlobal(), sortieId, bordereauSimule.getSaisiPar()
        );

        // 2. Sauvegarder le bordereau
        bordereauValide = bordereauPaieRepository.save(bordereauValide);

        // 3. Verrouiller les séances et sauvegarder
        for (FichePaieEnseignant fiche : bordereauValide.getFiches()) {
            for (LigneDecompteSeance ligne : fiche.getLignes()) {
                Affectation aff = affectationRepository.findById(ligne.getAffectationId())
                        .orElseThrow(() -> new IllegalStateException("Affectation introuvable"));
                
                aff.marquerPayee(fiche.getId(), ligne.getTarifApplique());
                affectationRepository.save(aff);
            }
        }

        return bordereauValide;
    }
}
