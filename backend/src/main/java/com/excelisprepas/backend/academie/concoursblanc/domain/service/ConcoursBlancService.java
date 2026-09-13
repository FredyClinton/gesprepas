package com.excelisprepas.backend.academie.concoursblanc.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.concoursblanc.domain.model.*;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ConcoursBlancRepositoryPort;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.EpreuveConcoursBlancRepositoryPort;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ResultatCandidatRepositoryPort;
import lombok.RequiredArgsConstructor;

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
        if (centreId != null) {
            List<ResultatCandidat> list = resultatRepository.findByConcoursBlancIdAndCentreId(concoursBlancId, centreId);
            if (formationId != null) {
                return list.stream().filter(r -> r.getFormationId().equals(formationId)).collect(Collectors.toList());
            }
            return list;
        } else if (formationId != null) {
            return resultatRepository.findByConcoursBlancIdAndFormationId(concoursBlancId, formationId);
        } else {
            return resultatRepository.findByConcoursBlancId(concoursBlancId);
        }
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

        List<ResultatCandidat> aSauvegarder = new ArrayList<>();
        for (ResultatCandidat r : resultats) {
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

        // Si le concours blanc est déjà publié, recalculer le classement
        if (cb.getStatut() == StatutConcoursBlanc.PUBLIE) {
            compilerResultats(concoursBlancId);
        }

        return saved;
    }

    public void compilerResultats(UUID concoursBlancId) {
        ConcoursBlanc cb = concoursBlancRepository.findById(concoursBlancId)
                .orElseThrow(() -> new IllegalArgumentException("Concours blanc non trouvé: " + concoursBlancId));

        List<EpreuveConcoursBlanc> epreuves = epreuveRepository.findByConcoursBlancId(concoursBlancId);
        Map<UUID, EpreuveConcoursBlanc> epreuvesMap = epreuves.stream()
                .collect(Collectors.toMap(EpreuveConcoursBlanc::getId, e -> e));

        List<ResultatCandidat> tousLesResultats = resultatRepository.findByConcoursBlancId(concoursBlancId);

        // Recherche du concours précédent dans la même session pour calculer le delta de progression
        Optional<ConcoursBlanc> cbPrecedentOpt = concoursBlancRepository.findPreviousConcours(cb.getSessionId(), cb.getNumero());
        Map<UUID, Integer> rangsPrecedentsParApprenant = new HashMap<>();
        if (cbPrecedentOpt.isPresent()) {
            List<ResultatCandidat> resultatsPrecedents = resultatRepository.findByConcoursBlancId(cbPrecedentOpt.get().getId());
            for (ResultatCandidat rp : resultatsPrecedents) {
                if (rp.getApprenantId() != null && rp.getRang() != null) {
                    rangsPrecedentsParApprenant.put(rp.getApprenantId(), rp.getRang());
                }
            }
        }

        // Regrouper par formation pour classer au sein de chaque formation
        Map<UUID, List<ResultatCandidat>> parFormation = tousLesResultats.stream()
                .collect(Collectors.groupingBy(ResultatCandidat::getFormationId));

        for (Map.Entry<UUID, List<ResultatCandidat>> entry : parFormation.entrySet()) {
            List<ResultatCandidat> listeFormation = entry.getValue();

            // 1. Calcul des totaux et moyennes
            for (ResultatCandidat r : listeFormation) {
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

            // 2. Tri par Total Pondéré décroissant
            listeFormation.sort((a, b) -> {
                BigDecimal tA = a.getTotalPondere() != null ? a.getTotalPondere() : BigDecimal.ZERO;
                BigDecimal tB = b.getTotalPondere() != null ? b.getTotalPondere() : BigDecimal.ZERO;
                return tB.compareTo(tA);
            });

            // 3. Attribution des rangs et calcul du delta progression
            int rang = 1;
            for (ResultatCandidat r : listeFormation) {
                r.setRang(rang++);

                if (r.getApprenantId() != null && rangsPrecedentsParApprenant.containsKey(r.getApprenantId())) {
                    int ancienRang = rangsPrecedentsParApprenant.get(r.getApprenantId());
                    // Ancien rang 5 - Nouveau rang 2 = +3 (progression de 3 places)
                    r.setDeltaRang(ancienRang - r.getRang());
                } else {
                    r.setDeltaRang(null);
                }
            }

            // 4. Attribution du Rang Centre (classement au sein du centre de chaque candidat)
            Map<UUID, List<ResultatCandidat>> parCentre = listeFormation.stream()
                    .collect(Collectors.groupingBy(ResultatCandidat::getCentreId));

            for (List<ResultatCandidat> listeCentre : parCentre.values()) {
                listeCentre.sort((a, b) -> {
                    BigDecimal tA = a.getTotalPondere() != null ? a.getTotalPondere() : BigDecimal.ZERO;
                    BigDecimal tB = b.getTotalPondere() != null ? b.getTotalPondere() : BigDecimal.ZERO;
                    return tB.compareTo(tA);
                });
                int rangCentre = 1;
                for (ResultatCandidat rc : listeCentre) {
                    rc.setRangCentre(rangCentre++);
                }
            }
        }

        resultatRepository.saveAll(tousLesResultats);
    }

    private void calculerTotauxIndividuels(ResultatCandidat r, UUID cbId) {
        List<EpreuveConcoursBlanc> epreuves = epreuveRepository.findByConcoursBlancId(cbId);
        Map<UUID, EpreuveConcoursBlanc> epreuvesMap = epreuves.stream()
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
