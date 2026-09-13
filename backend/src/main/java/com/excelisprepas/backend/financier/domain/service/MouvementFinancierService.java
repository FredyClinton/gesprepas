package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.model.*;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MouvementFinancierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.*;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
public class MouvementFinancierService implements SaisirEntreeUseCase, SaisirSortieUseCase,
        RecupererMouvementUseCase, ListerMouvementsUseCase, ListerVersementsApprenantUseCase,
        ModifierEntreeUseCase, SupprimerEntreeUseCase {

    private final EntreeRepositoryPort entreeRepository;
    private final SortieRepositoryPort sortieRepository;
    private final MotifRepositoryPort motifRepository;
    private final CentreRepositoryPort centreRepository;
    private final ApprenantRepositoryPort apprenantRepository;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final MouvementFinancierRepositoryPort mouvementRepository;
    private final com.excelisprepas.backend.inscription.domain.port.out.DossierInscriptionRepositoryPort dossierInscriptionRepository;
    private final com.excelisprepas.backend.apprenant.domain.port.out.ContratApprenantRepositoryPort contratApprenantRepository;
    private final com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort bilanRepository;
    private final com.excelisprepas.backend.livre.domain.port.out.VenteLivreRepositoryPort venteLivreRepository;

    public MouvementFinancierService(EntreeRepositoryPort entreeRepository,
                                     SortieRepositoryPort sortieRepository,
                                     MotifRepositoryPort motifRepository,
                                     CentreRepositoryPort centreRepository,
                                     ApprenantRepositoryPort apprenantRepository,
                                     SessionAcademiqueRepositoryPort sessionRepository,
                                     MouvementFinancierRepositoryPort mouvementRepository,
                                     com.excelisprepas.backend.inscription.domain.port.out.DossierInscriptionRepositoryPort dossierInscriptionRepository,
                                     com.excelisprepas.backend.apprenant.domain.port.out.ContratApprenantRepositoryPort contratApprenantRepository) {
        this(entreeRepository, sortieRepository, motifRepository, centreRepository, apprenantRepository,
                sessionRepository, mouvementRepository, dossierInscriptionRepository, contratApprenantRepository, null, null);
    }

    public MouvementFinancierService(EntreeRepositoryPort entreeRepository,
                                     SortieRepositoryPort sortieRepository,
                                     MotifRepositoryPort motifRepository,
                                     CentreRepositoryPort centreRepository,
                                     ApprenantRepositoryPort apprenantRepository,
                                     SessionAcademiqueRepositoryPort sessionRepository,
                                     MouvementFinancierRepositoryPort mouvementRepository,
                                     com.excelisprepas.backend.inscription.domain.port.out.DossierInscriptionRepositoryPort dossierInscriptionRepository,
                                     com.excelisprepas.backend.apprenant.domain.port.out.ContratApprenantRepositoryPort contratApprenantRepository,
                                     com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort bilanRepository,
                                     com.excelisprepas.backend.livre.domain.port.out.VenteLivreRepositoryPort venteLivreRepository) {
        this.entreeRepository = entreeRepository;
        this.sortieRepository = sortieRepository;
        this.motifRepository = motifRepository;
        this.centreRepository = centreRepository;
        this.apprenantRepository = apprenantRepository;
        this.sessionRepository = sessionRepository;
        this.mouvementRepository = mouvementRepository;
        this.dossierInscriptionRepository = dossierInscriptionRepository;
        this.contratApprenantRepository = contratApprenantRepository;
        this.bilanRepository = bilanRepository;
        this.venteLivreRepository = venteLivreRepository;
    }

    private Motif verifierMotif(UUID motifId, TypeMotif typeAttendu) {
        Motif motif = motifRepository.findById(motifId)
                .orElseThrow(() -> new MotifIntrouvableException(motifId));
        if (!motif.isActif()) {
            log.warn("Opération refusée : motif {} inactif", motifId);
            throw new MotifInactifException(motifId);
        }
        if (motif.getType() != typeAttendu) {
            log.warn("Opération refusée : motif {} de type {} au lieu de {}", motifId, motif.getType(), typeAttendu);
            throw new MotifTypeIncorrectException(motifId, typeAttendu, motif.getType());
        }
        return motif;
    }

    private void verifierSessionUtilisable(UUID sessionId) {
        SessionAcademique session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new SessionIntrouvableException(sessionId));
        if (session.getStatut() == StatutSession.CLOTUREE) {
            log.warn("Opération refusée : session {} clôturée", sessionId);
            throw new SessionNonUtilisableException(sessionId);
        }
    }

    @Override
    public Entree saisirEntree(UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                               UUID saisiParUtilisateurId, UUID centreId, UUID apprenantId, UUID dossierConcoursId) {
        Motif motif = verifierMotif(motifId, TypeMotif.ENTREE);
        verifierSessionUtilisable(sessionId);
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }

        UUID formationId = null;
        if (apprenantId != null) {
            Apprenant apprenant = apprenantRepository.findById(apprenantId)
                    .orElseThrow(() -> new ApprenantIntrouvableException(apprenantId));

            // Règle de non-dépassement : Si ce n'est pas un achat de livre ni un paiement dossier concours, contrôler le solde
            boolean estAchatLivre = motif.getNom().toLowerCase().contains("livre");
            if (dossierConcoursId == null && !estAchatLivre) {
                List<com.excelisprepas.backend.apprenant.domain.model.ContratApprenant> contrats = contratApprenantRepository.findByApprenantId(apprenantId);
                BigDecimal totalContrat = contrats.stream()
                        .filter(c -> "ACTIF".equalsIgnoreCase(c.getStatut()))
                        .map(com.excelisprepas.backend.apprenant.domain.model.ContratApprenant::getMontantTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (totalContrat.compareTo(BigDecimal.ZERO) == 0 && apprenant.getMontantContrat() != null) {
                    totalContrat = apprenant.getMontantContrat();
                }

                if (totalContrat.compareTo(BigDecimal.ZERO) > 0) {
                    List<Entree> versements = entreeRepository.findByApprenantId(apprenantId);
                    BigDecimal dejaPaye = versements.stream()
                            .filter(e -> e.getStatut() != StatutMouvement.REJETE && e.getDossierConcoursId().isEmpty())
                            .map(Entree::getMontant)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal soldeRestant = totalContrat.subtract(dejaPaye);
                    if (montant.compareTo(soldeRestant) > 0) {
                        log.warn("Tentative de dépassement de contrat pour apprenantId={}: montantSaisi={}, soldeRestant={}, totalContrat={}",
                                apprenantId, montant, soldeRestant, totalContrat);
                        throw new MontantDepasseContratException(apprenantId, montant, soldeRestant, totalContrat);
                    }
                }
            }

            List<com.excelisprepas.backend.inscription.domain.model.DossierInscription> dossiers = dossierInscriptionRepository.findByApprenantIdAndSessionId(apprenantId, sessionId);
            if (!dossiers.isEmpty() && dossiers.get(0).getFormationsCibles() != null && !dossiers.get(0).getFormationsCibles().isEmpty()) {
                formationId = dossiers.get(0).getFormationsCibles().get(0);
            }
            if (formationId == null) {
                formationId = apprenant.getFormationId();
            }
        }

        Entree entree = new Entree(UUID.randomUUID(), sessionId, motifId, montant, date,
                saisiParUtilisateurId, centreId, apprenantId, formationId, dossierConcoursId);
        entree.appliquerDecision(StatutMouvement.VALIDE);
        entree = entreeRepository.save(entree);
        log.info("Entrée saisie et validée : id={}, sessionId={}, montant={}, centreId={}", entree.getId(), sessionId, montant, centreId);
        return entree;
    }

    @Override
    public Sortie saisirSortie(UUID sessionId, UUID motifId, BigDecimal montant, LocalDate date,
                               UUID saisiParUtilisateurId, UUID centreId, String ordonnateur) {
        verifierMotif(motifId, TypeMotif.SORTIE);
        verifierSessionUtilisable(sessionId);
        if (centreId != null && centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }

        Sortie sortie = new Sortie(UUID.randomUUID(), sessionId, motifId, montant, date,
                saisiParUtilisateurId, centreId, ordonnateur);
        sortie = sortieRepository.save(sortie);
        log.info("Sortie saisie : id={}, sessionId={}, montant={}, centreId={}", sortie.getId(), sessionId, montant, centreId);
        return sortie;
    }

    @Override
    public MouvementFinancier recupererMouvement(UUID id) {
        return mouvementRepository.findById(id)
                .orElseThrow(() -> new MouvementFinancierIntrouvableException(id));
    }

    @Override
    public List<MouvementFinancier> listerMouvements(UUID sessionId, UUID centreId, StatutMouvement statut) {
        List<Entree> entrees;
        List<Sortie> sorties;

        if (centreId != null && statut != null) {
            entrees = entreeRepository.findBySessionIdAndCentreIdAndStatut(sessionId, centreId, statut);
            sorties = sortieRepository.findBySessionIdAndCentreIdAndStatut(sessionId, centreId, statut);
        } else if (centreId != null) {
            entrees = entreeRepository.findBySessionIdAndCentreId(sessionId, centreId);
            sorties = sortieRepository.findBySessionIdAndCentreId(sessionId, centreId);
        } else if (statut != null) {
            entrees = entreeRepository.findBySessionIdAndStatut(sessionId, statut);
            sorties = sortieRepository.findBySessionIdAndStatut(sessionId, statut);
        } else {
            entrees = entreeRepository.findBySessionId(sessionId);
            sorties = sortieRepository.findBySessionId(sessionId);
        }

        List<MouvementFinancier> resultat = new ArrayList<>();
        resultat.addAll(entrees);
        resultat.addAll(sorties);
        return resultat;
    }

    @Override
    public List<Entree> listerVersementsApprenant(UUID apprenantId) {
        if (apprenantRepository.findById(apprenantId).isEmpty()) {
            throw new ApprenantIntrouvableException(apprenantId);
        }
        return entreeRepository.findByApprenantId(apprenantId);
    }

    private void verifierBilanNonValide(UUID centreId, UUID sessionId, LocalDate date, UUID bilanJournalierId) {
        if (bilanJournalierId != null) {
            log.warn("Opération refusée : entrée rattachée au bilan clôturé {}", bilanJournalierId);
            throw new BilanDejaValideException("Impossible de modifier ou supprimer ce versement : il est déjà rattaché à un bilan clôturé.");
        }
        if (bilanRepository != null && centreId != null && sessionId != null && date != null) {
            var bilanOpt = bilanRepository.findByCentreIdAndSessionIdAndDate(centreId, sessionId, date);
            if (bilanOpt.isPresent()) {
                log.warn("Opération refusée : bilan déjà validé pour centreId={}, date={}", centreId, date);
                throw new BilanDejaValideException("Impossible de modifier ou supprimer ce versement : le bilan journalier du " + date + " a déjà été validé.");
            }
        }
    }

    @Override
    public Entree modifierEntree(UUID entreeId, BigDecimal montant, LocalDate date, UUID motifId, UUID apprenantId) {
        Entree entree = entreeRepository.findById(entreeId)
                .orElseThrow(() -> new MouvementFinancierIntrouvableException(entreeId));

        verifierSessionUtilisable(entree.getSessionId());
        verifierBilanNonValide(entree.getCentreId(), entree.getSessionId(), entree.getDate(), entree.getBilanJournalierId().orElse(null));

        if (date != null && !date.equals(entree.getDate())) {
            verifierBilanNonValide(entree.getCentreId(), entree.getSessionId(), date, null);
        }

        UUID motifFinal = motifId != null ? motifId : entree.getMotifId();
        Motif motif = verifierMotif(motifFinal, TypeMotif.ENTREE);

        UUID apprenantFinal = apprenantId != null ? apprenantId : entree.getApprenantId().orElse(null);
        BigDecimal montantFinal = montant != null ? montant : entree.getMontant();
        LocalDate dateFinal = date != null ? date : entree.getDate();

        UUID formationId = entree.getFormationId().orElse(null);

        if (apprenantFinal != null) {
            Apprenant apprenant = apprenantRepository.findById(apprenantFinal)
                    .orElseThrow(() -> new ApprenantIntrouvableException(apprenantFinal));

            boolean estAchatLivre = motif.getNom().toLowerCase().contains("livre");
            if (entree.getDossierConcoursId().isEmpty() && !estAchatLivre) {
                List<com.excelisprepas.backend.apprenant.domain.model.ContratApprenant> contrats =
                        contratApprenantRepository.findByApprenantId(apprenantFinal);
                BigDecimal totalContrat = contrats.stream()
                        .filter(c -> "ACTIF".equalsIgnoreCase(c.getStatut()))
                        .map(com.excelisprepas.backend.apprenant.domain.model.ContratApprenant::getMontantTotal)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                if (totalContrat.compareTo(BigDecimal.ZERO) == 0 && apprenant.getMontantContrat() != null) {
                    totalContrat = apprenant.getMontantContrat();
                }

                if (totalContrat.compareTo(BigDecimal.ZERO) > 0) {
                    List<Entree> versements = entreeRepository.findByApprenantId(apprenantFinal);
                    BigDecimal dejaPayeAutres = versements.stream()
                            .filter(e -> !e.getId().equals(entreeId) && e.getStatut() != StatutMouvement.REJETE && e.getDossierConcoursId().isEmpty())
                            .map(Entree::getMontant)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    BigDecimal soldeRestant = totalContrat.subtract(dejaPayeAutres);
                    if (montantFinal.compareTo(soldeRestant) > 0) {
                        log.warn("Dépassement de contrat lors de modification versement: montant={}, soldeRestant={}", montantFinal, soldeRestant);
                        throw new MontantDepasseContratException(apprenantFinal, montantFinal, soldeRestant, totalContrat);
                    }
                }
            }

            List<com.excelisprepas.backend.inscription.domain.model.DossierInscription> dossiers =
                    dossierInscriptionRepository.findByApprenantIdAndSessionId(apprenantFinal, entree.getSessionId());
            if (!dossiers.isEmpty() && dossiers.get(0).getFormationsCibles() != null && !dossiers.get(0).getFormationsCibles().isEmpty()) {
                formationId = dossiers.get(0).getFormationsCibles().get(0);
            } else if (apprenant.getFormationId() != null) {
                formationId = apprenant.getFormationId();
            }
        }

        Entree entreeMaj = entree.mettreAJour(montantFinal, dateFinal, motifFinal, apprenantFinal, formationId);
        entreeMaj = entreeRepository.save(entreeMaj);
        log.info("Entrée modifiée : id={}, montant={}, date={}", entreeMaj.getId(), montantFinal, dateFinal);
        return entreeMaj;
    }

    @Override
    public void supprimerEntree(UUID entreeId) {
        Entree entree = entreeRepository.findById(entreeId)
                .orElseThrow(() -> new MouvementFinancierIntrouvableException(entreeId));

        verifierSessionUtilisable(entree.getSessionId());
        verifierBilanNonValide(entree.getCentreId(), entree.getSessionId(), entree.getDate(), entree.getBilanJournalierId().orElse(null));

        // Si l'entrée était liée à des ventes de livres, annuler les ventes
        if (venteLivreRepository != null) {
            var ventesLiees = venteLivreRepository.findByEntreeId(entreeId);
            if (ventesLiees != null && !ventesLiees.isEmpty()) {
                venteLivreRepository.deleteAll(ventesLiees);
                log.info("Ventes de livres associées supprimées pour l'entrée {}", entreeId);
            }
        }

        entreeRepository.deleteById(entreeId);
        log.info("Entrée supprimée : id={}", entreeId);
    }
}