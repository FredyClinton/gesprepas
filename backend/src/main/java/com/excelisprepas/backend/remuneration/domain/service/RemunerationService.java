package com.excelisprepas.backend.remuneration.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.model.Affectation;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutPaiement;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.model.AffectationDepartementale;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.Sortie;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.HistoriqueTarifEnseignant;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueTarifRepositoryPort;
import com.excelisprepas.backend.remuneration.domain.model.*;
import com.excelisprepas.backend.remuneration.domain.port.in.ConsulterPaieEnseignantUseCase;
import com.excelisprepas.backend.remuneration.domain.port.in.ExecuterPaiementFicheUseCase;
import com.excelisprepas.backend.remuneration.domain.port.in.PreparerBordereauPaieUseCase;
import com.excelisprepas.backend.remuneration.domain.port.in.ValiderBordereauPaieUseCase;
import com.excelisprepas.backend.remuneration.domain.port.out.BordereauPaieRepositoryPort;
import com.excelisprepas.backend.remuneration.infrastructure.in.web.dto.*;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;

import com.excelisprepas.backend.academie.progression.infrastructure.out.persistence.ProgressionEntity;
import com.excelisprepas.backend.academie.progression.infrastructure.out.persistence.ProgressionJpaRepository;
import com.excelisprepas.backend.remuneration.infrastructure.out.persistence.FichePaieEnseignantEntity;
import com.excelisprepas.backend.remuneration.infrastructure.out.persistence.FichePaieEnseignantJpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Transactional
public class RemunerationService implements PreparerBordereauPaieUseCase, ValiderBordereauPaieUseCase,
        ExecuterPaiementFicheUseCase, ConsulterPaieEnseignantUseCase {

    private final AffectationRepositoryPort affectationRepository;
    private final EnseignantRepositoryPort enseignantRepository;
    private final HistoriqueTarifRepositoryPort historiqueTarifRepository;
    private final BordereauPaieRepositoryPort bordereauPaieRepository;
    private final SaisirSortieUseCase saisirSortieUseCase;

    private final AffectationDepartementaleRepositoryPort rosterRepository;
    private final DepartementRepositoryPort departementRepository;
    private final FormationRepositoryPort formationRepository;
    private final MatiereRepositoryPort matiereRepository;
    private final CentreRepositoryPort centreRepository;
    private final SalleRepositoryPort salleRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final ProgressionJpaRepository progressionJpaRepository;
    private final FichePaieEnseignantJpaRepository fichePaieJpaRepository;

    private final UUID motifRemunerationId = UUID.fromString("00000000-0000-0000-0000-000000000001");

    public RemunerationService(AffectationRepositoryPort affectationRepository,
                               EnseignantRepositoryPort enseignantRepository,
                               HistoriqueTarifRepositoryPort historiqueTarifRepository,
                               BordereauPaieRepositoryPort bordereauPaieRepository,
                               SaisirSortieUseCase saisirSortieUseCase) {
        this(affectationRepository, enseignantRepository, historiqueTarifRepository,
                bordereauPaieRepository, saisirSortieUseCase,
                null, null, null, null, null, null, null, null, null);
    }

    public RemunerationService(AffectationRepositoryPort affectationRepository,
                               EnseignantRepositoryPort enseignantRepository,
                               HistoriqueTarifRepositoryPort historiqueTarifRepository,
                               BordereauPaieRepositoryPort bordereauPaieRepository,
                               SaisirSortieUseCase saisirSortieUseCase,
                               AffectationDepartementaleRepositoryPort rosterRepository,
                               DepartementRepositoryPort departementRepository,
                               FormationRepositoryPort formationRepository,
                               MatiereRepositoryPort matiereRepository,
                               CentreRepositoryPort centreRepository,
                               SalleRepositoryPort salleRepository,
                               SessionAcademiqueRepositoryPort sessionRepository) {
        this(affectationRepository, enseignantRepository, historiqueTarifRepository,
                bordereauPaieRepository, saisirSortieUseCase,
                rosterRepository, departementRepository, formationRepository, matiereRepository,
                centreRepository, salleRepository, sessionRepository, null, null);
    }

    public RemunerationService(AffectationRepositoryPort affectationRepository,
                               EnseignantRepositoryPort enseignantRepository,
                               HistoriqueTarifRepositoryPort historiqueTarifRepository,
                               BordereauPaieRepositoryPort bordereauPaieRepository,
                               SaisirSortieUseCase saisirSortieUseCase,
                               AffectationDepartementaleRepositoryPort rosterRepository,
                               DepartementRepositoryPort departementRepository,
                               FormationRepositoryPort formationRepository,
                               MatiereRepositoryPort matiereRepository,
                               CentreRepositoryPort centreRepository,
                               SalleRepositoryPort salleRepository,
                               SessionAcademiqueRepositoryPort sessionRepository,
                               ProgressionJpaRepository progressionJpaRepository,
                               FichePaieEnseignantJpaRepository fichePaieJpaRepository) {
        this.affectationRepository = affectationRepository;
        this.enseignantRepository = enseignantRepository;
        this.historiqueTarifRepository = historiqueTarifRepository;
        this.bordereauPaieRepository = bordereauPaieRepository;
        this.saisirSortieUseCase = saisirSortieUseCase;
        this.rosterRepository = rosterRepository;
        this.departementRepository = departementRepository;
        this.formationRepository = formationRepository;
        this.matiereRepository = matiereRepository;
        this.centreRepository = centreRepository;
        this.salleRepository = salleRepository;
        this.sessionRepository = sessionRepository;
        this.progressionJpaRepository = progressionJpaRepository;
        this.fichePaieJpaRepository = fichePaieJpaRepository;
    }

    @Override
    public BordereauPaie preparerDecompte(UUID sessionId, LocalDate datePaiement, String saisiPar) {
        List<Affectation> seances = affectationRepository.findBySessionIdAndStatutAndStatutPaiement(
                sessionId, StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE);

        Map<UUID, List<Affectation>> seancesParEnseignant = seances.stream()
                .collect(Collectors.groupingBy(Affectation::getEnseignantId));

        List<FichePaieEnseignant> fiches = new ArrayList<>();
        UUID bordereauId = UUID.randomUUID();

        for (Map.Entry<UUID, List<Affectation>> entry : seancesParEnseignant.entrySet()) {
            UUID enseignantId = entry.getKey();
            List<Affectation> affectations = entry.getValue();

            Enseignant enseignant = enseignantRepository.findById(enseignantId)
                    .orElseThrow(() -> new IllegalStateException("Enseignant introuvable: " + enseignantId));

            List<LigneDecompteSeance> lignes = new ArrayList<>();

            for (Affectation aff : affectations) {
                Optional<HistoriqueTarifEnseignant> tarifHist = historiqueTarifRepository
                        .findTarifApplicable(enseignantId, sessionId, aff.getSemaine());

                BigDecimal tarifApplique = tarifHist.map(HistoriqueTarifEnseignant::getCoutParSeance)
                        .orElse(enseignant.getCoutParSeance());

                TypeLigneDecompte type = TypeLigneDecompte.NORMALE;
                lignes.add(new LigneDecompteSeance(aff.getId(), aff.getSemaine(), aff.getJour(), tarifApplique, type));
            }

            fiches.add(new FichePaieEnseignant(UUID.randomUUID(), bordereauId, enseignantId, lignes));
        }

        return new BordereauPaie(bordereauId, sessionId, "BORD-" + LocalDate.now(), datePaiement, fiches, UUID.randomUUID(), saisiPar);
    }

    public BordereauPaieDetailResponse preparerSimulationDetail(UUID sessionId, LocalDate datePaiement, String saisiPar) {
        LocalDate date = datePaiement != null ? datePaiement : LocalDate.now();
        BordereauPaie bordereauSimule = preparerDecompte(sessionId, date, saisiPar);

        return enrichirBordereauDetail(bordereauSimule);
    }

    @Override
    public BordereauPaie valider(BordereauPaie bordereauSimule) {
        UUID systemUserId = UUID.randomUUID();

        Sortie sortie = saisirSortieUseCase.saisirSortie(
                bordereauSimule.getSessionId(),
                motifRemunerationId,
                bordereauSimule.getMontantTotalGlobal(),
                bordereauSimule.getDatePaiement(),
                systemUserId,
                null,
                bordereauSimule.getSaisiPar()
        );
        UUID sortieId = sortie.getId();

        BordereauPaie bordereauValide = BordereauPaie.reconstituer(
                bordereauSimule.getId(), bordereauSimule.getSessionId(), bordereauSimule.getReference(),
                bordereauSimule.getDatePaiement(), bordereauSimule.getFiches(),
                bordereauSimule.getNombreTotalEnseignants(), bordereauSimule.getNombreTotalSeances(),
                bordereauSimule.getMontantTotalGlobal(), sortieId, bordereauSimule.getSaisiPar()
        );

        bordereauValide = bordereauPaieRepository.save(bordereauValide);

        for (FichePaieEnseignant fiche : bordereauSimule.getFiches()) {
            for (LigneDecompteSeance ligne : fiche.getLignes()) {
                Affectation aff = affectationRepository.findById(ligne.getAffectationId())
                        .orElseThrow(() -> new IllegalStateException("Affectation introuvable: " + ligne.getAffectationId()));

                aff.marquerProgrammee(fiche.getId(), ligne.getTarifApplique());
                affectationRepository.save(aff);
            }
        }

        return bordereauValide;
    }

    @Override
    public synchronized BordereauPaie validerBordereau(UUID sessionId, LocalDate datePaiement, String reference,
                                          List<LigneAjustementPaieEnseignant> lignesAjustees, String saisiPar) {
        LocalDate date = datePaiement != null ? datePaiement : LocalDate.now();

        // Si une référence est fournie, vérifier si ce bordereau a déjà été créé
        if (reference != null && !reference.isBlank()) {
            Optional<BordereauPaie> existant = bordereauPaieRepository.findByReference(reference);
            if (existant.isPresent()) {
                return existant.get();
            }
        }

        UUID bordereauId = UUID.randomUUID();
        String ref = (reference != null && !reference.isBlank())
                ? reference
                : "BORD-ENS-" + date + "-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase();

        List<FichePaieEnseignant> fiches = new ArrayList<>();
        Map<UUID, List<Affectation>> affectationsParFiche = new HashMap<>();

        for (LigneAjustementPaieEnseignant ajustement : lignesAjustees) {
            UUID enseignantId = ajustement.getEnseignantId();
            BigDecimal tarif = ajustement.getCoutParSeance();

            List<Affectation> seancesEnseignant;
            if (ajustement.getAffectationIds() != null && !ajustement.getAffectationIds().isEmpty()) {
                Set<UUID> cibles = new HashSet<>(ajustement.getAffectationIds());
                seancesEnseignant = affectationRepository.findBySessionIdAndStatutAndStatutPaiement(
                        sessionId, StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE).stream()
                        .filter(a -> a.getEnseignantId().equals(enseignantId) && cibles.contains(a.getId()))
                        .toList();
            } else {
                seancesEnseignant = affectationRepository.findBySessionIdAndStatutAndStatutPaiement(
                        sessionId, StatutAffectation.EFFECTUEE, StatutPaiement.NON_PAYEE).stream()
                        .filter(a -> a.getEnseignantId().equals(enseignantId))
                        .toList();
            }

            if (seancesEnseignant.isEmpty()) {
                continue;
            }

            List<LigneDecompteSeance> lignesDecompte = new ArrayList<>();
            for (Affectation aff : seancesEnseignant) {
                lignesDecompte.add(new LigneDecompteSeance(
                        aff.getId(), aff.getSemaine(), aff.getJour(), tarif, TypeLigneDecompte.NORMALE));
            }

            UUID ficheId = UUID.randomUUID();
            FichePaieEnseignant fiche = new FichePaieEnseignant(ficheId, bordereauId, enseignantId, lignesDecompte);
            fiches.add(fiche);
            affectationsParFiche.put(ficheId, seancesEnseignant);

            // Tracer l'historique de tarif si différent du tarif contractuel par défaut
            Optional<Enseignant> optEns = enseignantRepository.findById(enseignantId);
            if (optEns.isPresent() && optEns.get().getCoutParSeance().compareTo(tarif) != 0) {
                int minSemaine = seancesEnseignant.stream().mapToInt(Affectation::getSemaine).min().orElse(1);
                int maxSemaine = seancesEnseignant.stream().mapToInt(Affectation::getSemaine).max().orElse(52);
                historiqueTarifRepository.save(new HistoriqueTarifEnseignant(
                        UUID.randomUUID(), enseignantId, sessionId, minSemaine, maxSemaine, tarif));
            }
        }

        if (fiches.isEmpty()) {
            // Réconciliation anti-doublon : vérifier si ces séances viennent d'être programmées par une requête concurrente
            List<UUID> affIds = lignesAjustees.stream()
                    .filter(l -> l.getAffectationIds() != null)
                    .flatMap(l -> l.getAffectationIds().stream())
                    .toList();
            if (!affIds.isEmpty()) {
                for (UUID affId : affIds) {
                    Optional<Affectation> aff = affectationRepository.findById(affId);
                    if (aff.isPresent() && aff.get().getFichePaieId() != null) {
                        List<BordereauPaie> sessionBordereaux = bordereauPaieRepository.findBySessionId(sessionId);
                        for (BordereauPaie b : sessionBordereaux) {
                            boolean match = b.getFiches().stream().anyMatch(f -> f.getId().equals(aff.get().getFichePaieId()));
                            if (match) {
                                return b;
                            }
                        }
                    }
                }
            }
            throw new IllegalArgumentException("Aucune séance effectuée à rémunérer pour les enseignants sélectionnés.");
        }

        BigDecimal montantTotalGlobal = fiches.stream()
                .map(FichePaieEnseignant::getMontantTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 1. Engager la Sortie financière globale
        Sortie sortie = saisirSortieUseCase.saisirSortie(
                sessionId,
                motifRemunerationId,
                montantTotalGlobal,
                date,
                UUID.randomUUID(),
                null,
                saisiPar != null ? saisiPar : "DIRECTION"
        );

        // 2. Sauvegarder le bordereau
        BordereauPaie bordereau = new BordereauPaie(
                bordereauId, sessionId, ref, date, fiches, sortie.getId(),
                saisiPar != null ? saisiPar : "DIRECTION");

        BordereauPaie savedBordereau = bordereauPaieRepository.save(bordereau);

        // 3. Verrouiller les affectations en PROGRAMMEE
        for (FichePaieEnseignant fiche : fiches) {
            List<Affectation> seances = affectationsParFiche.get(fiche.getId());
            Map<UUID, Affectation> mapSeances = (seances != null)
                    ? seances.stream().collect(Collectors.toMap(Affectation::getId, a -> a))
                    : Collections.emptyMap();

            for (LigneDecompteSeance ligne : fiche.getLignes()) {
                Affectation aff = mapSeances.get(ligne.getAffectationId());
                if (aff == null) {
                    aff = affectationRepository.findById(ligne.getAffectationId())
                            .orElseThrow(() -> new IllegalStateException("Affectation introuvable: " + ligne.getAffectationId()));
                }

                aff.marquerProgrammee(fiche.getId(), ligne.getTarifApplique());
                affectationRepository.save(aff);
            }
        }

        return savedBordereau;
    }

    @Override
    public void executerPaiement(UUID bordereauId, UUID ficheId, String executePar) {
        BordereauPaie bordereau = bordereauPaieRepository.findById(bordereauId)
                .orElseThrow(() -> new IllegalStateException("Bordereau introuvable: " + bordereauId));

        FichePaieEnseignant fiche = bordereau.getFiches().stream()
                .filter(f -> f.getId().equals(ficheId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("Fiche de paie introuvable: " + ficheId));

        if (fiche.getStatut() == StatutFichePaie.PAYEE) {
            return; // Idempotent : déjà payée
        }

        fiche.executerPaiement();

        List<Affectation> affectations = affectationRepository.findByFichePaieId(fiche.getId());
        for (Affectation aff : affectations) {
            if (aff.getStatutPaiement() != StatutPaiement.PAYEE) {
                aff.marquerPayee();
                affectationRepository.save(aff);
            }
        }

        bordereauPaieRepository.save(bordereau);
    }

    @Override
    public List<BordereauPaie> listerBordereauxParSession(UUID sessionId) {
        return bordereauPaieRepository.findBySessionId(sessionId);
    }

    @Override
    public Optional<BordereauPaie> recupererBordereau(UUID bordereauId) {
        return bordereauPaieRepository.findById(bordereauId);
    }

    public BordereauPaieDetailResponse recupererBordereauDetail(UUID bordereauId) {
        BordereauPaie bordereau = bordereauPaieRepository.findById(bordereauId)
                .orElseThrow(() -> new IllegalStateException("Bordereau introuvable: " + bordereauId));

        return enrichirBordereauDetail(bordereau);
    }

    public FichePaieDetailResponse recupererFicheDetail(UUID ficheId) {
        List<Affectation> affectations = affectationRepository.findByFichePaieId(ficheId);

        UUID enseignantId = null;
        UUID sessionId = null;
        String referenceBordereau = "";
        LocalDate datePaiement = LocalDate.now();
        String saisiPar = "DIRECTION";
        UUID bordereauId = null;
        StatutFichePaie statutFiche = StatutFichePaie.PROGRAMMEE;

        if (affectations.isEmpty() && fichePaieJpaRepository != null) {
            Optional<FichePaieEnseignantEntity> optFiche = fichePaieJpaRepository.findById(ficheId);
            if (optFiche.isPresent()) {
                FichePaieEnseignantEntity fe = optFiche.get();
                enseignantId = fe.getEnseignantId();
                statutFiche = fe.getStatut();
                if (fe.getBordereauPaie() != null) {
                    referenceBordereau = fe.getBordereauPaie().getReference();
                    datePaiement = fe.getBordereauPaie().getDatePaiement();
                    saisiPar = fe.getBordereauPaie().getSaisiPar();
                    bordereauId = fe.getBordereauPaie().getId();
                    sessionId = fe.getBordereauPaie().getSessionId();
                }
            }
        }

        if (affectations.isEmpty() && sessionId != null) {
            List<BordereauPaie> bordereaux = bordereauPaieRepository.findBySessionId(sessionId);
            for (BordereauPaie b : bordereaux) {
                for (FichePaieEnseignant f : b.getFiches()) {
                    if (f.getId().equals(ficheId)) {
                        for (LigneDecompteSeance l : f.getLignes()) {
                            affectationRepository.findById(l.getAffectationId()).ifPresent(affectations::add);
                        }
                        break;
                    }
                }
                if (!affectations.isEmpty()) break;
            }
        }

        if (affectations.isEmpty()) {
            throw new IllegalStateException("Aucune séance rattachée à la fiche de paie: " + ficheId);
        }

        Affectation premier = affectations.get(0);
        final UUID finalEnseignantId = enseignantId != null ? enseignantId : premier.getEnseignantId();
        final UUID finalSessionId = sessionId != null ? sessionId : premier.getSessionId();

        Enseignant enseignant = enseignantRepository.findById(finalEnseignantId)
                .orElseThrow(() -> new IllegalStateException("Enseignant introuvable: " + finalEnseignantId));

        String departementNom = "Non rattaché";
        if (rosterRepository != null && departementRepository != null) {
            List<AffectationDepartementale> r = rosterRepository.findByEnseignantId(finalEnseignantId);
            if (!r.isEmpty()) {
                departementNom = departementRepository.findById(r.get(0).getDepartementId())
                        .map(Departement::getNom)
                        .orElse("Non rattaché");
            }
        }

        String sessionNom = "Session";
        if (sessionRepository != null) {
            sessionNom = sessionRepository.findById(finalSessionId)
                    .map(SessionAcademique::getAnnee)
                    .orElse("Session");
        }

        if (referenceBordereau.isEmpty()) {
            List<BordereauPaie> bordereaux = bordereauPaieRepository.findBySessionId(finalSessionId);
            for (BordereauPaie b : bordereaux) {
                boolean hasFiche = b.getFiches().stream().anyMatch(f -> f.getId().equals(ficheId));
                if (hasFiche) {
                    referenceBordereau = b.getReference();
                    datePaiement = b.getDatePaiement();
                    saisiPar = b.getSaisiPar();
                    bordereauId = b.getId();
                    break;
                }
            }
        }

        statutFiche = premier.getStatutPaiement() == StatutPaiement.PAYEE
                ? StatutFichePaie.PAYEE
                : StatutFichePaie.PROGRAMMEE;

        BigDecimal coutParSeance = premier.getCoutApplique() != null
                ? premier.getCoutApplique()
                : enseignant.getCoutParSeance();

        List<SeanceFichePaieItemResponse> seanceItems = new ArrayList<>();
        BigDecimal totalMontant = BigDecimal.ZERO;

        for (Affectation aff : affectations) {
            BigDecimal cout = aff.getCoutApplique() != null ? aff.getCoutApplique() : coutParSeance;
            totalMontant = totalMontant.add(cout);
            seanceItems.add(construireSeanceItem(aff, coutParSeance));
        }

        return new FichePaieDetailResponse(
                ficheId,
                bordereauId != null ? bordereauId : premier.getFichePaieId(),
                referenceBordereau,
                datePaiement,
                finalSessionId,
                sessionNom,
                enseignant.getId(),
                enseignant.getNom(),
                enseignant.getPrenom(),
                enseignant.getMatricule(),
                enseignant.getTelephone(),
                enseignant.getEmail(),
                departementNom,
                affectations.size(),
                coutParSeance,
                totalMontant,
                statutFiche,
                saisiPar,
                seanceItems
        );
    }

    private SeanceFichePaieItemResponse construireSeanceItem(Affectation aff, BigDecimal tarifParDefaut) {
        BigDecimal cout = aff.getCoutApplique() != null ? aff.getCoutApplique() : tarifParDefaut;

        String centreNom = (centreRepository != null)
                ? centreRepository.findById(aff.getCentreId()).map(c -> c.getNom()).orElse("Centre")
                : "Centre";
        String formationNom = (formationRepository != null)
                ? formationRepository.findById(aff.getFormationId()).map(f -> f.getNom()).orElse("Formation")
                : "Formation";
        String matiereNom = (matiereRepository != null)
                ? matiereRepository.findById(aff.getMatiereId()).map(m -> m.getNom()).orElse("Matière")
                : "Matière";
        String salleNom = (salleRepository != null)
                ? salleRepository.findById(aff.getSalleId()).map(s -> s.getNom()).orElse("Salle")
                : "Salle";

        LocalDate dateSeance = null;
        if (sessionRepository != null) {
            Optional<SessionAcademique> optSession = sessionRepository.findById(aff.getSessionId());
            if (optSession.isPresent()) {
                SessionAcademique session = optSession.get();
                int jourOffset = switch (aff.getJour()) {
                    case LUNDI -> 0;
                    case MARDI -> 1;
                    case MERCREDI -> 2;
                    case JEUDI -> 3;
                    case VENDREDI -> 4;
                    case SAMEDI -> 5;
                };
                dateSeance = session.getDateDebut().plusDays((long) (aff.getSemaine() - 1) * 7 + jourOffset);
            }
        }

        String horaire = switch (aff.getSeance()) {
            case 1 -> "08h00 - 10h30";
            case 2 -> "10h45 - 13h15";
            case 3 -> "14h00 - 16h30";
            case 4 -> "16h45 - 19h15";
            default -> "Séance " + aff.getSeance();
        };

        String duree = "2h30";

        String theme = "Séance de cours";
        if (progressionJpaRepository != null) {
            int numeroCours = determinerNumeroCours(aff);
            Optional<ProgressionEntity> optProg = progressionJpaRepository
                    .findFirstByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
                            aff.getFormationId(), aff.getMatiereId(), aff.getSemaine(), numeroCours);
            if (optProg.isPresent()) {
                theme = optProg.get().getTheme();
            } else {
                Optional<ProgressionEntity> optProgSemaine = progressionJpaRepository
                        .findFirstByFormationIdAndMatiereIdAndSemaine(
                                aff.getFormationId(), aff.getMatiereId(), aff.getSemaine());
                if (optProgSemaine.isPresent()) {
                    theme = optProgSemaine.get().getTheme();
                }
            }
        }

        return new SeanceFichePaieItemResponse(
                aff.getId(),
                aff.getSemaine(),
                aff.getJour(),
                aff.getSeance(),
                dateSeance,
                horaire,
                duree,
                centreNom,
                formationNom,
                matiereNom,
                salleNom,
                theme,
                cout,
                aff.getStatutPaiement()
        );
    }

    private BordereauPaieDetailResponse enrichirBordereauDetail(BordereauPaie bordereau) {
        List<FichePaieEnseignantDetailResponse> fichesDetail = new ArrayList<>();

        for (FichePaieEnseignant fiche : bordereau.getFiches()) {
            Enseignant enseignant = enseignantRepository.findById(fiche.getEnseignantId()).orElse(null);
            String nom = enseignant != null ? enseignant.getNom() : "Enseignant";
            String prenom = enseignant != null ? enseignant.getPrenom() : "";
            String matricule = enseignant != null ? enseignant.getMatricule() : "";
            BigDecimal coutUnitaire = enseignant != null ? enseignant.getCoutParSeance() : BigDecimal.ZERO;

            String departementNom = "Non rattaché";
            if (enseignant != null && rosterRepository != null && departementRepository != null) {
                List<AffectationDepartementale> r = rosterRepository.findByEnseignantId(enseignant.getId());
                if (!r.isEmpty()) {
                    departementNom = departementRepository.findById(r.get(0).getDepartementId())
                            .map(Departement::getNom)
                            .orElse("Non rattaché");
                }
            }

            List<UUID> affectationIds = fiche.getLignes().stream()
                    .map(LigneDecompteSeance::getAffectationId)
                    .toList();

            BigDecimal coutParSeance = fiche.getLignes().isEmpty()
                    ? coutUnitaire
                    : fiche.getLignes().get(0).getTarifApplique();

            List<SeanceFichePaieItemResponse> seancesItems = new ArrayList<>();
            for (LigneDecompteSeance ligne : fiche.getLignes()) {
                affectationRepository.findById(ligne.getAffectationId())
                        .ifPresent(aff -> seancesItems.add(construireSeanceItem(aff, ligne.getTarifApplique())));
            }

            fichesDetail.add(new FichePaieEnseignantDetailResponse(
                    fiche.getId(),
                    fiche.getEnseignantId(),
                    nom,
                    prenom,
                    matricule,
                    departementNom,
                    fiche.getNombreSeances(),
                    coutParSeance,
                    fiche.getMontantTotal(),
                    fiche.getStatut(),
                    affectationIds,
                    seancesItems
            ));
        }

        return new BordereauPaieDetailResponse(
                bordereau.getId(),
                bordereau.getSessionId(),
                bordereau.getReference(),
                bordereau.getDatePaiement(),
                bordereau.getNombreTotalEnseignants(),
                bordereau.getNombreTotalSeances(),
                bordereau.getMontantTotalGlobal(),
                bordereau.getSortieId(),
                bordereau.getSaisiPar(),
                fichesDetail
        );
    }

    public int determinerNumeroCours(Affectation aff) {
        if (affectationRepository == null) {
            return aff.getSeance();
        }
        List<Affectation> seancesSemaine = affectationRepository
                .findBySessionIdAndSemaine(aff.getSessionId(), aff.getSemaine());
        if (seancesSemaine == null || seancesSemaine.isEmpty()) {
            return aff.getSeance();
        }

        List<Affectation> seancesMatiereSalle = new ArrayList<>(seancesSemaine.stream()
                .filter(a -> a.getStatut() != StatutAffectation.ANNULEE)
                .filter(a -> a.getFormationId().equals(aff.getFormationId())
                        && a.getMatiereId().equals(aff.getMatiereId())
                        && a.getSalleId().equals(aff.getSalleId()))
                .toList());

        seancesMatiereSalle.sort(Comparator
                .comparingInt((Affectation a) -> switch (a.getJour()) {
                    case LUNDI -> 0;
                    case MARDI -> 1;
                    case MERCREDI -> 2;
                    case JEUDI -> 3;
                    case VENDREDI -> 4;
                    case SAMEDI -> 5;
                })
                .thenComparingInt(Affectation::getSeance));

        for (int i = 0; i < seancesMatiereSalle.size(); i++) {
            if (seancesMatiereSalle.get(i).getId().equals(aff.getId())) {
                return i + 1;
            }
        }

        return aff.getSeance();
    }

    @Transactional
    public void mettreAJourThemeSeance(UUID affectationId, String nouveauTheme) {
        if (nouveauTheme == null || nouveauTheme.trim().isEmpty()) {
            throw new IllegalArgumentException("Le thème ne peut pas être vide");
        }
        Affectation aff = affectationRepository.findById(affectationId)
                .orElseThrow(() -> new IllegalArgumentException("Affectation introuvable: " + affectationId));

        int numeroCours = determinerNumeroCours(aff);

        if (progressionJpaRepository != null) {
            Optional<ProgressionEntity> optProg = progressionJpaRepository
                    .findFirstByFormationIdAndMatiereIdAndSemaineAndNumeroCours(
                            aff.getFormationId(), aff.getMatiereId(), aff.getSemaine(), numeroCours);
            if (optProg.isPresent()) {
                ProgressionEntity prog = optProg.get();
                prog.setTheme(nouveauTheme.trim());
                progressionJpaRepository.save(prog);
            } else {
                UUID phaseId = UUID.fromString("c1234567-89ab-cdef-0123-456789abcdef");
                List<ProgressionEntity> existantes = progressionJpaRepository.findByFormationId(aff.getFormationId());
                if (!existantes.isEmpty() && existantes.get(0).getPhaseId() != null) {
                    phaseId = existantes.get(0).getPhaseId();
                }

                ProgressionEntity nouvelleProg = new ProgressionEntity();
                nouvelleProg.setId(UUID.randomUUID());
                nouvelleProg.setFormationId(aff.getFormationId());
                nouvelleProg.setSessionId(aff.getSessionId());
                nouvelleProg.setPhaseId(phaseId);
                nouvelleProg.setMatiereId(aff.getMatiereId());
                nouvelleProg.setSemaine(aff.getSemaine());
                nouvelleProg.setNumeroCours(numeroCours);
                nouvelleProg.setTheme(nouveauTheme.trim());
                nouvelleProg.setContenu(nouveauTheme.trim());
                progressionJpaRepository.save(nouvelleProg);
            }
        }
    }
}
