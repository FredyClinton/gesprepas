package com.excelisprepas.backend.remuneration.domain.service;

import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.personnel.domain.model.HistoriqueSalairePersonnel;
import com.excelisprepas.backend.personnel.domain.model.Personnel;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueSalairePersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import com.excelisprepas.backend.remuneration.domain.model.BordereauPaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.model.FichePaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.model.LigneSaisiePaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.port.in.ConsulterPaiePersonnelUseCase;
import com.excelisprepas.backend.remuneration.domain.port.in.PreparerBordereauPersonnelUseCase;
import com.excelisprepas.backend.remuneration.domain.port.in.ValiderBordereauPersonnelUseCase;
import com.excelisprepas.backend.remuneration.domain.port.out.BordereauPaiePersonnelRepositoryPort;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

public class RemunerationPersonnelService implements PreparerBordereauPersonnelUseCase,
        ValiderBordereauPersonnelUseCase, ConsulterPaiePersonnelUseCase {

    private final PersonnelRepositoryPort personnelRepository;
    private final HistoriqueSalairePersonnelRepositoryPort historiqueSalaireRepository;
    private final BordereauPaiePersonnelRepositoryPort bordereauPaiePersonnelRepository;
    private final SaisirSortieUseCase saisirSortieUseCase;

    private final UUID motifSalairePersonnelId = UUID.fromString("00000000-0000-0000-0000-000000000002");

    public RemunerationPersonnelService(PersonnelRepositoryPort personnelRepository,
                                        HistoriqueSalairePersonnelRepositoryPort historiqueSalaireRepository,
                                        BordereauPaiePersonnelRepositoryPort bordereauPaiePersonnelRepository,
                                        SaisirSortieUseCase saisirSortieUseCase) {
        this.personnelRepository = personnelRepository;
        this.historiqueSalaireRepository = historiqueSalaireRepository;
        this.bordereauPaiePersonnelRepository = bordereauPaiePersonnelRepository;
        this.saisirSortieUseCase = saisirSortieUseCase;
    }

    @Override
    public BordereauPaiePersonnel preparerSimulation(UUID sessionId, LocalDate datePaiement, String intitule, String saisiPar) {
        LocalDate date = datePaiement != null ? datePaiement : LocalDate.now();
        List<Personnel> tous = personnelRepository.findAll();

        UUID bordereauId = UUID.randomUUID();
        List<FichePaiePersonnel> fiches = new ArrayList<>();

        for (Personnel p : tous) {
            Optional<HistoriqueSalairePersonnel> hist = historiqueSalaireRepository
                    .findDernierSalaireApplicable(p.getId(), sessionId, date);

            BigDecimal salaireRef = hist.map(HistoriqueSalairePersonnel::getSalaireReference).orElse(BigDecimal.ZERO);
            fiches.add(new FichePaiePersonnel(UUID.randomUUID(), bordereauId, p.getId(), salaireRef, salaireRef, null));
        }

        return new BordereauPaiePersonnel(
                bordereauId, sessionId, "BORD-PERS-" + LocalDate.now() + "-" + UUID.randomUUID().toString().substring(0, 5),
                intitule != null ? intitule : "Paie Personnel", date, fiches, UUID.randomUUID(), saisiPar);
    }

    @Override
    public BordereauPaiePersonnel validerBordereau(UUID sessionId, LocalDate datePaiement, String intitule,
                                                   List<LigneSaisiePaiePersonnel> lignesSaisie, String saisiPar) {
        LocalDate date = datePaiement != null ? datePaiement : LocalDate.now();
        UUID bordereauId = UUID.randomUUID();
        List<FichePaiePersonnel> fiches = new ArrayList<>();

        BigDecimal total = BigDecimal.ZERO;
        for (LigneSaisiePaiePersonnel ligne : lignesSaisie) {
            if (ligne.getMontantPaye().signum() > 0) {
                fiches.add(new FichePaiePersonnel(
                        UUID.randomUUID(), bordereauId, ligne.getPersonnelId(),
                        ligne.getSalaireReference(), ligne.getMontantPaye(), ligne.getObservations()));
                total = total.add(ligne.getMontantPaye());
            }
        }

        if (fiches.isEmpty()) {
            throw new IllegalArgumentException("Aucun personnel sélectionné avec un montant supérieur à 0");
        }

        // Création de la Sortie financière globale (centreId = null)
        Sortie sortie = saisirSortieUseCase.saisirSortie(
                sessionId,
                motifSalairePersonnelId,
                total,
                date,
                UUID.randomUUID(), // User system ou id de saisiPar si dispo
                null, // centreId = null car c'est une sortie globale
                saisiPar != null ? saisiPar : "DIRECTION"
        );

        BordereauPaiePersonnel bordereau = new BordereauPaiePersonnel(
                bordereauId, sessionId, "BORD-PERS-" + LocalDate.now() + "-" + UUID.randomUUID().toString().substring(0, 5),
                intitule != null ? intitule : "Paie Personnel", date, fiches, sortie.getId(), saisiPar != null ? saisiPar : "DIRECTION");

        return bordereauPaiePersonnelRepository.save(bordereau);
    }

    @Override
    public Optional<BordereauPaiePersonnel> recupererBordereau(UUID bordereauId) {
        return bordereauPaiePersonnelRepository.findById(bordereauId);
    }

    @Override
    public List<BordereauPaiePersonnel> listerParSession(UUID sessionId) {
        return bordereauPaiePersonnelRepository.findBySessionId(sessionId);
    }
}
