package com.excelisprepas.backend.apprenant.domain.service;

import com.excelisprepas.backend.academie.phase.domain.model.Phase;
import com.excelisprepas.backend.academie.phase.domain.port.out.PhaseRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.model.ContratApprenant;
import com.excelisprepas.backend.apprenant.domain.model.InscriptionPhaseFormation;
import com.excelisprepas.backend.apprenant.domain.port.in.ChangerFormationPhaseUseCase;
import com.excelisprepas.backend.apprenant.domain.port.in.CreerContratPhaseUseCase;
import com.excelisprepas.backend.apprenant.domain.port.in.RecupererCursusApprenantUseCase;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ContratApprenantRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.InscriptionPhaseFormationRepositoryPort;
import com.excelisprepas.backend.shared.exception.ApprenantIntrouvableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public class CursusApprenantService implements CreerContratPhaseUseCase, ChangerFormationPhaseUseCase, RecupererCursusApprenantUseCase {

    private static final Logger log = LoggerFactory.getLogger(CursusApprenantService.class);

    private final ApprenantRepositoryPort apprenantRepositoryPort;
    private final ContratApprenantRepositoryPort contratApprenantRepositoryPort;
    private final InscriptionPhaseFormationRepositoryPort inscriptionPhaseFormationRepositoryPort;
    private final PhaseRepositoryPort phaseRepositoryPort;

    public CursusApprenantService(ApprenantRepositoryPort apprenantRepositoryPort,
                                  ContratApprenantRepositoryPort contratApprenantRepositoryPort,
                                  InscriptionPhaseFormationRepositoryPort inscriptionPhaseFormationRepositoryPort) {
        this(apprenantRepositoryPort, contratApprenantRepositoryPort, inscriptionPhaseFormationRepositoryPort, null);
    }

    public CursusApprenantService(ApprenantRepositoryPort apprenantRepositoryPort,
                                  ContratApprenantRepositoryPort contratApprenantRepositoryPort,
                                  InscriptionPhaseFormationRepositoryPort inscriptionPhaseFormationRepositoryPort,
                                  PhaseRepositoryPort phaseRepositoryPort) {
        this.apprenantRepositoryPort = apprenantRepositoryPort;
        this.contratApprenantRepositoryPort = contratApprenantRepositoryPort;
        this.inscriptionPhaseFormationRepositoryPort = inscriptionPhaseFormationRepositoryPort;
        this.phaseRepositoryPort = phaseRepositoryPort;
    }

    @Override
    public ResultatContratPhase creerContratPhase(UUID apprenantId, UUID phaseId, UUID formationId,
                                                 BigDecimal montantContrat, LocalDate dateSignature,
                                                 String observations) {
        Objects.requireNonNull(apprenantId, "apprenantId ne peut pas être nul");
        Objects.requireNonNull(phaseId, "phaseId ne peut pas être nul");
        Objects.requireNonNull(formationId, "formationId ne peut pas être nulle");
        Objects.requireNonNull(montantContrat, "montantContrat ne peut pas être nul");

        Apprenant apprenant = apprenantRepositoryPort.findById(apprenantId)
                .orElseThrow(() -> new ApprenantIntrouvableException(apprenantId));

        LocalDate dateEffet = dateSignature != null ? dateSignature : LocalDate.now();

        // 1. Clôturer proprement les inscriptions précédentes de phase encore marquées "EN_COURS"
        List<InscriptionPhaseFormation> existantes = inscriptionPhaseFormationRepositoryPort.findByApprenantId(apprenantId);
        for (InscriptionPhaseFormation prev : existantes) {
            if ("EN_COURS".equalsIgnoreCase(prev.getStatut()) && !prev.getPhaseId().equals(phaseId)) {
                prev.cloturer(dateEffet);
                inscriptionPhaseFormationRepositoryPort.save(prev);
                log.info("Inscription précédente clôturée : apprenantId={}, phaseId={}, formationId={}",
                        apprenantId, prev.getPhaseId(), prev.getFormationId());
            }
        }

        // 2. Générer et enregistrer le nouveau contrat
        String refContrat = "CTR-" + dateEffet.getYear() + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        ContratApprenant contrat = new ContratApprenant(
                UUID.randomUUID(),
                apprenantId,
                refContrat,
                dateEffet,
                montantContrat,
                "ACTIF",
                observations != null ? observations : "Contrat pour nouvelle phase"
        );
        final ContratApprenant contratEnregistre = contratApprenantRepositoryPort.save(contrat);
        log.info("Nouveau contrat créé : id={}, ref={}, apprenantId={}, montant={}",
                contratEnregistre.getId(), contratEnregistre.getReference(), apprenantId, montantContrat);

        // 3. Enregistrer l'attachement à la phase (règle absolue : ne jamais écraser les phases antérieures)
        InscriptionPhaseFormation inscription = inscriptionPhaseFormationRepositoryPort
                .findByApprenantIdAndPhaseId(apprenantId, phaseId)
                .orElseGet(() -> new InscriptionPhaseFormation(
                        UUID.randomUUID(),
                        apprenantId,
                        contratEnregistre.getId(),
                        phaseId,
                        formationId,
                        "EN_COURS",
                        dateEffet,
                        null,
                        null
                ));

        inscription.setContratId(contratEnregistre.getId());
        inscription.transfererFormation(formationId);
        inscription = inscriptionPhaseFormationRepositoryPort.save(inscription);

        // 4. Mettre à jour l'apprenant pour refléter sa filière active
        apprenant.modifierFormationId(formationId);
        BigDecimal montantActuel = apprenant.getMontantContrat() != null ? apprenant.getMontantContrat() : BigDecimal.ZERO;
        apprenant.modifierMontantContrat(montantActuel.add(montantContrat));
        apprenantRepositoryPort.save(apprenant);

        return new ResultatContratPhase(contrat, inscription);
    }

    @Override
    public InscriptionPhaseFormation changerFormationPhase(UUID apprenantId, UUID phaseId, UUID nouvelleFormationId) {
        Objects.requireNonNull(apprenantId, "apprenantId ne peut pas être nul");
        Objects.requireNonNull(phaseId, "phaseId ne peut pas être nul");
        Objects.requireNonNull(nouvelleFormationId, "nouvelleFormationId ne peut pas être nulle");

        Apprenant apprenant = apprenantRepositoryPort.findById(apprenantId)
                .orElseThrow(() -> new ApprenantIntrouvableException(apprenantId));

        InscriptionPhaseFormation inscription = inscriptionPhaseFormationRepositoryPort
                .findByApprenantIdAndPhaseId(apprenantId, phaseId)
                .orElseThrow(() -> new IllegalArgumentException("Aucune inscription trouvée pour cet apprenant sur la phase " + phaseId));

        inscription.transfererFormation(nouvelleFormationId);
        inscription = inscriptionPhaseFormationRepositoryPort.save(inscription);

        apprenant.modifierFormationId(nouvelleFormationId);
        apprenantRepositoryPort.save(apprenant);

        log.info("Changement de formation effectué : apprenantId={}, phaseId={}, ancienneFormation={}, nouvelleFormation={}",
                apprenantId, phaseId, inscription.getFormationPrecedenteId(), nouvelleFormationId);

        return inscription;
    }

    @Override
    public CursusComplet recupererCursus(UUID apprenantId) {
        Apprenant apprenant = apprenantRepositoryPort.findById(apprenantId)
                .orElseThrow(() -> new ApprenantIntrouvableException(apprenantId));

        List<ContratApprenant> contrats = contratApprenantRepositoryPort.findByApprenantId(apprenantId);
        List<InscriptionPhaseFormation> inscriptions = inscriptionPhaseFormationRepositoryPort.findByApprenantId(apprenantId);

        // Auto-création et traçabilité du contrat initial si aucun contrat n'a encore été enregistré
        if (contrats.isEmpty() && apprenant.getMontantContrat() != null && apprenant.getMontantContrat().compareTo(BigDecimal.ZERO) > 0) {
            String refInit = "CTR-" + (apprenant.getDateInscription() != null ? apprenant.getDateInscription().getYear() : LocalDate.now().getYear()) + "-INIT";
            ContratApprenant contratInit = new ContratApprenant(
                    UUID.randomUUID(),
                    apprenantId,
                    refInit,
                    apprenant.getDateInscription() != null ? apprenant.getDateInscription() : LocalDate.now(),
                    apprenant.getMontantContrat(),
                    "ACTIF",
                    "Contrat initial d'engagement (Admission)"
            );
            contratInit = contratApprenantRepositoryPort.save(contratInit);
            contrats = List.of(contratInit);

            if (inscriptions.isEmpty() && apprenant.getFormationId() != null) {
                UUID phaseInitialeId = null;
                if (phaseRepositoryPort != null) {
                    phaseInitialeId = phaseRepositoryPort.findAll().stream()
                            .map(Phase::getId)
                            .findFirst()
                            .orElse(null);
                }
                if (phaseInitialeId != null) {
                    InscriptionPhaseFormation insInit = new InscriptionPhaseFormation(
                            UUID.randomUUID(),
                            apprenantId,
                            contratInit.getId(),
                            phaseInitialeId,
                            apprenant.getFormationId(),
                            "EN_COURS",
                            apprenant.getDateInscription() != null ? apprenant.getDateInscription() : LocalDate.now(),
                            null,
                            null
                    );
                    insInit = inscriptionPhaseFormationRepositoryPort.save(insInit);
                    inscriptions = List.of(insInit);
                }
            }
        } else if (!contrats.isEmpty() && !inscriptions.isEmpty()) {
            if (contrats.size() == 1 && inscriptions.size() == 1 && inscriptions.get(0).getContratId() == null) {
                InscriptionPhaseFormation premiere = inscriptions.get(0);
                premiere.setContratId(contrats.get(0).getId());
                inscriptionPhaseFormationRepositoryPort.save(premiere);
            }
        }

        BigDecimal totalCumule = contrats.stream()
                .map(ContratApprenant::getMontantTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (totalCumule.compareTo(BigDecimal.ZERO) == 0 && apprenant.getMontantContrat() != null) {
            totalCumule = apprenant.getMontantContrat();
        }

        UUID phaseActive = inscriptions.stream()
                .filter(i -> "EN_COURS".equalsIgnoreCase(i.getStatut()))
                .map(InscriptionPhaseFormation::getPhaseId)
                .findFirst()
                .orElse(null);

        return new CursusComplet(
                apprenantId,
                apprenant.getFormationId(),
                phaseActive,
                totalCumule,
                contrats,
                inscriptions
        );
    }
}
