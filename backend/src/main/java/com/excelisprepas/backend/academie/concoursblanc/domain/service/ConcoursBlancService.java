package com.excelisprepas.backend.academie.concoursblanc.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.*;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ConcoursBlancRepositoryPort;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.EpreuveConcoursBlancRepositoryPort;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ResultatCandidatRepositoryPort;


import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

public class ConcoursBlancService {

    private final ConcoursBlancRepositoryPort concoursBlancRepository;
    private final EpreuveConcoursBlancRepositoryPort epreuveRepository;
    private final ResultatCandidatRepositoryPort resultatRepository;

    public ConcoursBlancService(ConcoursBlancRepositoryPort concoursBlancRepository,
                               EpreuveConcoursBlancRepositoryPort epreuveRepository,
                               ResultatCandidatRepositoryPort resultatRepository) {
        this.concoursBlancRepository = concoursBlancRepository;
        this.epreuveRepository = epreuveRepository;
        this.resultatRepository = resultatRepository;
    }

    public ConcoursBlanc creerConcoursBlanc(UUID sessionId, String titre, int numero,
                                           LocalDate dateEpreuve, Jour jour, int semaine,
                                           int seanceDebut, int seanceFin,
                                           boolean tousLesCentres, List<UUID> centreIds,
                                           List<EpreuveParam> epreuvesParams) {
        ConcoursBlanc cb = new ConcoursBlanc(
                UUID.randomUUID(),
                sessionId,
                titre,
                numero,
                dateEpreuve,
                jour,
                semaine,
                StatutConcoursBlanc.PROGRAMME,
                seanceDebut,
                seanceFin,
                tousLesCentres,
                centreIds
        );
        ConcoursBlanc savedCb = concoursBlancRepository.save(cb);

        if (epreuvesParams != null && !epreuvesParams.isEmpty()) {
            List<EpreuveConcoursBlanc> epreuves = epreuvesParams.stream().map(p -> new EpreuveConcoursBlanc(
                    UUID.randomUUID(),
                    savedCb.getId(),
                    p.formationId(),
                    p.matiereId(),
                    p.intitule(),
                    p.dureeMinutes(),
                    p.noteMax(),
                    p.coefficient(),
                    null,
                    null
            )).collect(Collectors.toList());
            List<EpreuveConcoursBlanc> savedEpreuves = epreuveRepository.saveAll(epreuves);
            savedCb.setEpreuves(savedEpreuves);
        }

        return savedCb;
    }

    public ConcoursBlanc modifierConcoursBlanc(UUID id, String titre, int numero,
                                              LocalDate dateEpreuve, Jour jour, int semaine,
                                              int seanceDebut, int seanceFin,
                                              boolean tousLesCentres, List<UUID> centreIds,
                                              List<EpreuveParam> epreuvesParams) {
        ConcoursBlanc cb = concoursBlancRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Concours blanc introuvable: " + id));

        cb.setTitre(titre);
        cb.setNumero(numero);
        cb.setDateEpreuve(dateEpreuve);
        cb.setJour(jour);
        cb.setSemaine(semaine);
        cb.setSeanceDebut(seanceDebut);
        cb.setSeanceFin(seanceFin);
        cb.setTousLesCentres(tousLesCentres);
        cb.setCentreIds(centreIds != null ? centreIds : new ArrayList<>());

        List<EpreuveConcoursBlanc> existantes = epreuveRepository.findByConcoursBlancId(id);
        Map<String, EpreuveConcoursBlanc> mapExistantes = existantes.stream()
                .collect(Collectors.toMap(e -> e.getFormationId() + ":" + e.getMatiereId(), e -> e, (e1, e2) -> e1));

        epreuveRepository.deleteByConcoursBlancId(id);

        if (epreuvesParams != null && !epreuvesParams.isEmpty()) {
            List<EpreuveConcoursBlanc> epreuves = epreuvesParams.stream().map(p -> {
                String key = p.formationId() + ":" + p.matiereId();
                EpreuveConcoursBlanc ancienne = mapExistantes.get(key);
                String contenu = ancienne != null ? ancienne.getContenuEvaluation() : null;
                String consignes = ancienne != null ? ancienne.getConsignes() : null;
                UUID epId = ancienne != null ? ancienne.getId() : UUID.randomUUID();
                return new EpreuveConcoursBlanc(
                        epId,
                        id,
                        p.formationId(),
                        p.matiereId(),
                        p.intitule(),
                        p.dureeMinutes(),
                        p.noteMax(),
                        p.coefficient(),
                        contenu,
                        consignes
                );
            }).collect(Collectors.toList());
            List<EpreuveConcoursBlanc> savedEpreuves = epreuveRepository.saveAll(epreuves);
            cb.setEpreuves(savedEpreuves);
        } else {
            cb.setEpreuves(new ArrayList<>());
        }

        return concoursBlancRepository.save(cb);
    }

    public List<ConcoursBlanc> listerParSession(UUID sessionId) {
        List<ConcoursBlanc> list = concoursBlancRepository.findBySessionId(sessionId);
        for (ConcoursBlanc cb : list) {
            cb.setEpreuves(epreuveRepository.findByConcoursBlancId(cb.getId()));
        }
        return list;
    }

    public Optional<ConcoursBlanc> recupererParId(UUID id) {
        Optional<ConcoursBlanc> opt = concoursBlancRepository.findById(id);
        opt.ifPresent(cb -> cb.setEpreuves(epreuveRepository.findByConcoursBlancId(cb.getId())));
        return opt;
    }

    public void supprimerConcoursBlanc(UUID id) {
        concoursBlancRepository.deleteById(id);
    }

    public Optional<EpreuveConcoursBlanc> recupererEpreuve(UUID epreuveId) {
        return epreuveRepository.findById(epreuveId);
    }

    public EpreuveConcoursBlanc definirContenuEpreuve(UUID concoursBlancId, UUID epreuveId,
                                                     String contenuEvaluation, String consignes) {
        EpreuveConcoursBlanc epreuve = epreuveRepository.findById(epreuveId)
                .orElseThrow(() -> new IllegalArgumentException("Épreuve non trouvée: " + epreuveId));
        if (!epreuve.getConcoursBlancId().equals(concoursBlancId)) {
            throw new IllegalArgumentException("L'épreuve n'appartient pas à ce concours blanc");
        }
        epreuve.setContenuEvaluation(contenuEvaluation);
        epreuve.setConsignes(consignes);
        return epreuveRepository.save(epreuve);
    }

    public ConcoursBlanc basculerVerrouillageSaisieCentres(UUID id, boolean bloquer) {
        ConcoursBlanc cb = concoursBlancRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Concours blanc non trouvé: " + id));
        cb.setSaisieNotesBloqueeCentre(bloquer);
        cb.setEpreuves(epreuveRepository.findByConcoursBlancId(id));
        ConcoursBlanc saved = concoursBlancRepository.save(cb);
        saved.setEpreuves(epreuveRepository.findByConcoursBlancId(id));
        return saved;
    }

    public ConcoursBlanc changerStatut(UUID id, StatutConcoursBlanc nouveauStatut) {
        ConcoursBlanc cb = concoursBlancRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Concours blanc non trouvé: " + id));
        cb.setStatut(nouveauStatut);
        cb.setEpreuves(epreuveRepository.findByConcoursBlancId(id));
        if (nouveauStatut == StatutConcoursBlanc.PUBLIE) {
            compilerResultats(id);
        }
        ConcoursBlanc saved = concoursBlancRepository.save(cb);
        saved.setEpreuves(epreuveRepository.findByConcoursBlancId(id));
        return saved;
    }

    public List<ResultatCandidat> recupererResultats(UUID concoursBlancId, UUID centreId, UUID formationId) {
        List<ResultatCandidat> list;
        if (centreId != null) {
            List<ResultatCandidat> brut = resultatRepository.findByConcoursBlancIdAndCentreId(concoursBlancId, centreId);
            if (formationId != null) {
                list = brut.stream().filter(r -> formationId.equals(r.getFormationId())).collect(Collectors.toList());
            } else {
                list = new ArrayList<>(brut);
            }
        } else if (formationId != null) {
            list = new ArrayList<>(resultatRepository.findByConcoursBlancIdAndFormationId(concoursBlancId, formationId));
        } else {
            list = new ArrayList<>(resultatRepository.findByConcoursBlancId(concoursBlancId));
        }

        // Tri systématique par rang pour assurer un classement ordonné à l'affichage
        list.sort((a, b) -> {
            Integer rA = centreId != null ? a.getRangCentre() : a.getRang();
            Integer rB = centreId != null ? b.getRangCentre() : b.getRang();
            if (rA != null && rB != null) {
                int cmp = rA.compareTo(rB);
                if (cmp != 0) return cmp;
            } else if (rA != null) {
                return -1;
            } else if (rB != null) {
                return 1;
            }

            BigDecimal tA = a.getTotalPondere() != null ? a.getTotalPondere() : BigDecimal.ZERO;
            BigDecimal tB = b.getTotalPondere() != null ? b.getTotalPondere() : BigDecimal.ZERO;
            int cmpT = tB.compareTo(tA);
            if (cmpT != 0) return cmpT;

            String nomA = a.getNomComplet() != null ? a.getNomComplet() : "";
            String nomB = b.getNomComplet() != null ? b.getNomComplet() : "";
            return nomA.compareToIgnoreCase(nomB);
        });

        return list;
    }

    public List<ResultatCandidat> enregistrerNotes(UUID concoursBlancId, UUID centreId,
                                                  List<ResultatCandidat> resultats) {
        ConcoursBlanc cb = concoursBlancRepository.findById(concoursBlancId)
                .orElseThrow(() -> new IllegalArgumentException("Concours blanc non trouvé: " + concoursBlancId));

        List<ResultatCandidat> existants = resultatRepository.findByConcoursBlancIdAndCentreId(concoursBlancId, centreId);
        Map<UUID, ResultatCandidat> existantsParApprenant = new HashMap<>();
        Map<UUID, ResultatCandidat> existantsParId = new HashMap<>();
        Map<String, ResultatCandidat> existantsParNom = new HashMap<>();

        for (ResultatCandidat ex : existants) {
            if (ex.getApprenantId() != null) {
                existantsParApprenant.put(ex.getApprenantId(), ex);
            }
            existantsParId.put(ex.getId(), ex);
            if (ex.getNomComplet() != null) {
                existantsParNom.put(ex.getNomComplet().trim().toLowerCase(), ex);
            }
        }

        Map<UUID, EpreuveConcoursBlanc> epreuvesMap = cb.getEpreuves().stream()
                .collect(Collectors.toMap(EpreuveConcoursBlanc::getId, e -> e, (e1, e2) -> e1));

        List<ResultatCandidat> aSauvegarder = new ArrayList<>();
        for (ResultatCandidat r : resultats) {
            // Contrôle strict du barème pour chaque épreuve notée
            if (r.getNotes() != null) {
                for (NoteEpreuve n : r.getNotes()) {
                    if (n.note() != null && (n.statut() == null || n.statut() == StatutNote.NOTE)) {
                        if (n.note().compareTo(BigDecimal.ZERO) < 0) {
                            throw new IllegalArgumentException("La note ne peut pas être négative pour " + r.getNomComplet());
                        }
                        EpreuveConcoursBlanc ep = epreuvesMap.get(n.epreuveId());
                        if (ep != null && ep.getNoteMax() != null && n.note().compareTo(ep.getNoteMax()) > 0) {
                            throw new IllegalArgumentException("La note " + n.note() + " dépasse le barème max ("
                                    + ep.getNoteMax() + ") pour l'épreuve '" + ep.getIntitule() + "' du candidat "
                                    + r.getNomComplet());
                        }
                    }
                }
            }

            ResultatCandidat existant = null;
            if (r.getId() != null && existantsParId.containsKey(r.getId())) {
                existant = existantsParId.get(r.getId());
            } else if (r.getApprenantId() != null && existantsParApprenant.containsKey(r.getApprenantId())) {
                existant = existantsParApprenant.get(r.getApprenantId());
            } else if (r.getNomComplet() != null) {
                existant = existantsParNom.get(r.getNomComplet().trim().toLowerCase());
            }

            UUID resId = existant != null ? existant.getId() : (r.getId() != null ? r.getId() : UUID.randomUUID());
            ResultatCandidat candidatFinal = new ResultatCandidat(
                    resId,
                    concoursBlancId,
                    r.getFormationId(),
                    centreId,
                    r.getApprenantId() != null ? r.getApprenantId() : (existant != null ? existant.getApprenantId() : null),
                    r.getNomComplet(),
                    (r.getEtablissementOrigine() != null && !r.getEtablissementOrigine().isBlank()) 
                            ? r.getEtablissementOrigine() 
                            : (existant != null ? existant.getEtablissementOrigine() : null),
                    r.isHorsListe(),
                    r.getNotes()
            );
            if (existant != null) {
                candidatFinal.setRang(existant.getRang());
                candidatFinal.setRangCentre(existant.getRangCentre());
                candidatFinal.setDeltaRang(existant.getDeltaRang());
            }
            calculerTotauxIndividuels(candidatFinal, cb.getId());
            aSauvegarder.add(candidatFinal);
        }

        List<ResultatCandidat> saved = resultatRepository.saveAll(aSauvegarder);

        // Mise à jour directe et systématique du classement (général et par centre)
        compilerResultats(concoursBlancId);

        return saved;
    }

    public void compilerResultats(UUID concoursBlancId) {
        ConcoursBlanc cb = concoursBlancRepository.findById(concoursBlancId)
                .orElseThrow(() -> new IllegalArgumentException("Concours blanc non trouvé: " + concoursBlancId));

        List<EpreuveConcoursBlanc> epreuves = epreuveRepository.findByConcoursBlancId(concoursBlancId);
        List<ResultatCandidat> tousLesResultats = resultatRepository.findByConcoursBlancId(concoursBlancId);
        if (tousLesResultats.isEmpty()) {
            return;
        }

        // Recherche du concours précédent dans la même session pour calculer le delta de progression
        Optional<ConcoursBlanc> cbPrecedentOpt = concoursBlancRepository.findPreviousConcours(cb.getSessionId(), cb.getNumero());
        Map<UUID, Integer> rangsPrecedentsParApprenant = new HashMap<>();
        Map<String, Integer> rangsPrecedentsParNom = new HashMap<>();
        if (cbPrecedentOpt.isPresent()) {
            List<ResultatCandidat> resultatsPrecedents = resultatRepository.findByConcoursBlancId(cbPrecedentOpt.get().getId());
            for (ResultatCandidat rp : resultatsPrecedents) {
                if (rp.getRang() != null) {
                    if (rp.getApprenantId() != null) {
                        rangsPrecedentsParApprenant.put(rp.getApprenantId(), rp.getRang());
                    }
                    if (rp.getNomComplet() != null) {
                        rangsPrecedentsParNom.put(rp.getNomComplet().trim().toLowerCase(), rp.getRang());
                    }
                }
            }
        }

        // Regrouper par formation pour classer au sein de chaque formation
        Map<UUID, List<ResultatCandidat>> parFormation = tousLesResultats.stream()
                .filter(r -> r.getFormationId() != null)
                .collect(Collectors.groupingBy(ResultatCandidat::getFormationId));

        for (Map.Entry<UUID, List<ResultatCandidat>> entry : parFormation.entrySet()) {
            UUID formationId = entry.getKey();
            List<ResultatCandidat> listeFormation = entry.getValue();

            // Épreuves et coefficient total de la formation
            List<EpreuveConcoursBlanc> epreuvesFormation = epreuves.stream()
                    .filter(e -> formationId.equals(e.getFormationId()))
                    .collect(Collectors.toList());

            BigDecimal coefTotalFormation = BigDecimal.ZERO;
            for (EpreuveConcoursBlanc ep : epreuvesFormation) {
                BigDecimal coef = ep.getCoefficient() != null && ep.getCoefficient().signum() > 0
                        ? ep.getCoefficient() : BigDecimal.ONE;
                coefTotalFormation = coefTotalFormation.add(coef);
            }

            Map<UUID, EpreuveConcoursBlanc> mapEpreuvesFormation = epreuvesFormation.stream()
                    .collect(Collectors.toMap(EpreuveConcoursBlanc::getId, e -> e));

            // 1. Calcul des totaux et moyennes : les personnes ayant manqué la totalité des épreuves sont considérées comme ABSENTES
            for (ResultatCandidat r : listeFormation) {
                if (aManqueTotaliteEpreuves(r, epreuvesFormation)) {
                    r.setTotalPondere(null);
                    r.setMoyennePonderee(null);
                    r.setRang(null);
                    r.setRangCentre(null);
                    r.setDeltaRang(null);
                } else {
                    BigDecimal total = BigDecimal.ZERO;

                    if (r.getNotes() != null) {
                        for (NoteEpreuve ne : r.getNotes()) {
                            EpreuveConcoursBlanc ep = mapEpreuvesFormation.get(ne.epreuveId());
                            if (ep != null) {
                                BigDecimal coef = ep.getCoefficient() != null && ep.getCoefficient().signum() > 0
                                        ? ep.getCoefficient() : BigDecimal.ONE;

                                if (ne.statut() == StatutNote.NOTE && ne.note() != null) {
                                    total = total.add(ne.note().multiply(coef));
                                }
                            }
                        }
                    }

                    r.setTotalPondere(total.setScale(2, RoundingMode.HALF_UP));
                    if (coefTotalFormation.signum() > 0) {
                        r.setMoyennePonderee(total.divide(coefTotalFormation, 2, RoundingMode.HALF_UP));
                    } else {
                        r.setMoyennePonderee(BigDecimal.ZERO);
                    }
                }
            }

            // 2. Classement des candidats présents uniquement (ayant composé à au moins une épreuve)
            List<ResultatCandidat> presents = listeFormation.stream()
                    .filter(r -> !aManqueTotaliteEpreuves(r, epreuvesFormation))
                    .collect(Collectors.toList());

            // Tri par Total Pondéré décroissant, puis alphabétique pour stabilité
            presents.sort((a, b) -> {
                BigDecimal tA = a.getTotalPondere() != null ? a.getTotalPondere() : BigDecimal.ZERO;
                BigDecimal tB = b.getTotalPondere() != null ? b.getTotalPondere() : BigDecimal.ZERO;
                int cmp = tB.compareTo(tA);
                if (cmp != 0) return cmp;
                String nomA = a.getNomComplet() != null ? a.getNomComplet() : "";
                String nomB = b.getNomComplet() != null ? b.getNomComplet() : "";
                return nomA.compareToIgnoreCase(nomB);
            });

            // 3. Attribution des rangs généraux avec gestion des ex-aequo (aux présents uniquement)
            int index = 0;
            BigDecimal dernierTotal = null;
            int dernierRang = 0;

            for (ResultatCandidat r : presents) {
                index++;
                BigDecimal currentTotal = r.getTotalPondere() != null ? r.getTotalPondere() : BigDecimal.ZERO;
                if (dernierTotal != null && currentTotal.compareTo(dernierTotal) == 0) {
                    r.setRang(dernierRang);
                } else {
                    r.setRang(index);
                    dernierRang = index;
                    dernierTotal = currentTotal;
                }

                if (r.getApprenantId() != null && rangsPrecedentsParApprenant.containsKey(r.getApprenantId())) {
                    int ancienRang = rangsPrecedentsParApprenant.get(r.getApprenantId());
                    r.setDeltaRang(ancienRang - r.getRang());
                } else if (r.getNomComplet() != null && rangsPrecedentsParNom.containsKey(r.getNomComplet().trim().toLowerCase())) {
                    int ancienRang = rangsPrecedentsParNom.get(r.getNomComplet().trim().toLowerCase());
                    r.setDeltaRang(ancienRang - r.getRang());
                } else {
                    r.setDeltaRang(null);
                }
            }

            // 4. Attribution du Rang Centre aux présents uniquement (au sein de chaque centre)
            Map<UUID, List<ResultatCandidat>> parCentre = presents.stream()
                    .filter(rc -> rc.getCentreId() != null)
                    .collect(Collectors.groupingBy(ResultatCandidat::getCentreId));

            for (List<ResultatCandidat> listeCentre : parCentre.values()) {
                listeCentre.sort((a, b) -> {
                    BigDecimal tA = a.getTotalPondere() != null ? a.getTotalPondere() : BigDecimal.ZERO;
                    BigDecimal tB = b.getTotalPondere() != null ? b.getTotalPondere() : BigDecimal.ZERO;
                    int cmp = tB.compareTo(tA);
                    if (cmp != 0) return cmp;
                    String nomA = a.getNomComplet() != null ? a.getNomComplet() : "";
                    String nomB = b.getNomComplet() != null ? b.getNomComplet() : "";
                    return nomA.compareToIgnoreCase(nomB);
                });

                int cIndex = 0;
                BigDecimal cDernierTotal = null;
                int cDernierRang = 0;

                for (ResultatCandidat rc : listeCentre) {
                    cIndex++;
                    BigDecimal currentTotal = rc.getTotalPondere() != null ? rc.getTotalPondere() : BigDecimal.ZERO;
                    if (cDernierTotal != null && currentTotal.compareTo(cDernierTotal) == 0) {
                        rc.setRangCentre(cDernierRang);
                    } else {
                        rc.setRangCentre(cIndex);
                        cDernierRang = cIndex;
                        cDernierTotal = currentTotal;
                    }
                }
            }
        }

        resultatRepository.saveAll(tousLesResultats);
    }

    private boolean aManqueTotaliteEpreuves(ResultatCandidat r, List<EpreuveConcoursBlanc> epreuvesFormation) {
        if (epreuvesFormation == null || epreuvesFormation.isEmpty()) {
            return false;
        }
        if (r.getNotes() == null || r.getNotes().isEmpty()) {
            return true;
        }
        // Le candidat est considéré absent s'il n'a composé à AUCUNE épreuve (aucune note avec statut NOTE et note != null)
        long nbEpreuvesComposees = r.getNotes().stream()
                .filter(ne -> ne.statut() == StatutNote.NOTE && ne.note() != null)
                .count();
        return nbEpreuvesComposees == 0;
    }

    private void calculerTotauxIndividuels(ResultatCandidat r, UUID cbId) {
        List<EpreuveConcoursBlanc> epreuves = epreuveRepository.findByConcoursBlancId(cbId);
        List<EpreuveConcoursBlanc> epreuvesFormation = epreuves.stream()
                .filter(e -> r.getFormationId() != null && r.getFormationId().equals(e.getFormationId()))
                .collect(Collectors.toList());

        if (aManqueTotaliteEpreuves(r, epreuvesFormation)) {
            r.setTotalPondere(null);
            r.setMoyennePonderee(null);
            r.setRang(null);
            r.setRangCentre(null);
            r.setDeltaRang(null);
            return;
        }

        Map<UUID, EpreuveConcoursBlanc> epreuvesMap = epreuvesFormation.stream()
                .collect(Collectors.toMap(EpreuveConcoursBlanc::getId, e -> e));

        BigDecimal total = BigDecimal.ZERO;
        BigDecimal coefTotal = BigDecimal.ZERO;

        for (NoteEpreuve ne : r.getNotes()) {
            EpreuveConcoursBlanc ep = epreuvesMap.get(ne.epreuveId());
            if (ep != null) {
                BigDecimal coef = ep.getCoefficient() != null && ep.getCoefficient().signum() > 0
                        ? ep.getCoefficient() : BigDecimal.ONE;
                coefTotal = coefTotal.add(coef);

                if (ne.statut() == StatutNote.NOTE && ne.note() != null) {
                    total = total.add(ne.note().multiply(coef));
                }
            }
        }

        r.setTotalPondere(total.setScale(2, RoundingMode.HALF_UP));
        if (coefTotal.signum() > 0) {
            r.setMoyennePonderee(total.divide(coefTotal, 2, RoundingMode.HALF_UP));
        } else {
            r.setMoyennePonderee(BigDecimal.ZERO);
        }
    }

    public Map<UUID, BigDecimal> trouverMeilleuresNotesParEpreuve(UUID concoursBlancId, UUID formationId) {
        List<ResultatCandidat> resultats = resultatRepository.findByConcoursBlancIdAndFormationId(concoursBlancId, formationId);
        Map<UUID, BigDecimal> maxMap = new HashMap<>();

        for (ResultatCandidat r : resultats) {
            for (NoteEpreuve ne : r.getNotes()) {
                if (ne.statut() == StatutNote.NOTE && ne.note() != null) {
                    maxMap.merge(ne.epreuveId(), ne.note(), (n1, n2) -> n1.compareTo(n2) >= 0 ? n1 : n2);
                }
            }
        }
        return maxMap;
    }

    public record EpreuveParam(
            UUID formationId,
            UUID matiereId,
            String intitule,
            int dureeMinutes,
            BigDecimal noteMax,
            BigDecimal coefficient
    ) {}
}
