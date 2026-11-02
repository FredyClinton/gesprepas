package com.excelisprepas.backend.academie.affectation.domain.model;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public class Affectation {

    private static final Set<StatutAffectation> STATUTS_ASSIGNABLES =
            Set.of(StatutAffectation.PLANIFIEE, StatutAffectation.ASSIGNEE);
    private final UUID id;
    private final UUID centreId;
    private final UUID sessionId;
    private final UUID formationId;
    private final UUID salleId;
    private UUID matiereId;
    private final Jour jour;
    private final int seance;
    private final int semaine;
    private UUID enseignantId;
    private StatutAffectation statut;
    private StatutPaiement statutPaiement;
    private java.math.BigDecimal coutApplique;
    private UUID fichePaieId;
    private LocalDate dateSeance;
    private LocalTime heureDebut;
    private LocalTime heureFin;

    public Affectation(UUID id, UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                       UUID enseignantId, Jour jour, int seance, int semaine, StatutAffectation statut) {
        this(id, centreId, sessionId, formationId, salleId, matiereId, enseignantId, jour, seance, semaine, statut,
                null, horaireDebutParDefaut(seance), horaireFinParDefaut(seance));
    }

    public Affectation(UUID id, UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                       UUID enseignantId, Jour jour, int seance, int semaine, StatutAffectation statut,
                       LocalDate dateSeance, LocalTime heureDebut, LocalTime heureFin) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.centreId = Objects.requireNonNull(centreId, "centreId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.formationId = Objects.requireNonNull(formationId, "formationId ne peut pas être nul");
        this.salleId = Objects.requireNonNull(salleId, "salleId ne peut pas être nul");
        this.matiereId = Objects.requireNonNull(matiereId, "matiereId ne peut pas être nul");
        this.enseignantId = enseignantId; // nullable : pas encore assigné à la création
        this.jour = Objects.requireNonNull(jour, "jour ne peut pas être nul");
        this.seance = validerPositif(seance, "seance");
        this.semaine = validerPositif(semaine, "semaine");
        this.statut = Objects.requireNonNull(statut, "statut ne peut pas être nul");
        this.statutPaiement = StatutPaiement.NON_PAYEE;
        this.dateSeance = dateSeance;
        this.heureDebut = heureDebut != null ? heureDebut : horaireDebutParDefaut(seance);
        this.heureFin = heureFin != null ? heureFin : horaireFinParDefaut(seance);
        validerHoraires();
    }

    private Affectation(UUID id, UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                        UUID enseignantId, Jour jour, int seance, int semaine, StatutAffectation statut,
                        StatutPaiement statutPaiement, java.math.BigDecimal coutApplique, UUID fichePaieId,
                        LocalDate dateSeance, LocalTime heureDebut, LocalTime heureFin) {
        this.id = id;
        this.centreId = centreId;
        this.sessionId = sessionId;
        this.formationId = formationId;
        this.salleId = salleId;
        this.matiereId = matiereId;
        this.enseignantId = enseignantId;
        this.jour = jour;
        this.seance = seance;
        this.semaine = semaine;
        this.statut = statut;
        this.statutPaiement = statutPaiement != null ? statutPaiement : StatutPaiement.NON_PAYEE;
        this.coutApplique = coutApplique;
        this.fichePaieId = fichePaieId;
        this.dateSeance = dateSeance;
        this.heureDebut = heureDebut != null ? heureDebut : horaireDebutParDefaut(seance);
        this.heureFin = heureFin != null ? heureFin : horaireFinParDefaut(seance);
        validerHoraires();
    }

    public static Affectation reconstituer(UUID id, UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                                           UUID enseignantId, Jour jour, int seance, int semaine, StatutAffectation statut,
                                           StatutPaiement statutPaiement, java.math.BigDecimal coutApplique, UUID fichePaieId) {
        return new Affectation(id, centreId, sessionId, formationId, salleId, matiereId, enseignantId, jour, seance, semaine, statut,
                statutPaiement, coutApplique, fichePaieId, null, null, null);
    }

    public static Affectation reconstituer(UUID id, UUID centreId, UUID sessionId, UUID formationId, UUID salleId, UUID matiereId,
                                           UUID enseignantId, Jour jour, int seance, int semaine, StatutAffectation statut,
                                           StatutPaiement statutPaiement, java.math.BigDecimal coutApplique, UUID fichePaieId,
                                           LocalDate dateSeance, LocalTime heureDebut, LocalTime heureFin) {
        return new Affectation(id, centreId, sessionId, formationId, salleId, matiereId, enseignantId, jour, seance, semaine, statut,
                statutPaiement, coutApplique, fichePaieId, dateSeance, heureDebut, heureFin);
    }

    public static LocalTime horaireDebutParDefaut(int seance) {
        return switch (seance) {
            case 1 -> LocalTime.of(8, 0);
            case 2 -> LocalTime.of(10, 45);
            case 3 -> LocalTime.of(14, 0);
            case 4 -> LocalTime.of(16, 45);
            default -> LocalTime.of(8, 0).plusMinutes(Math.max(0, seance - 1) * 165L);
        };
    }

    public static LocalTime horaireFinParDefaut(int seance) {
        return switch (seance) {
            case 1 -> LocalTime.of(10, 30);
            case 2 -> LocalTime.of(13, 15);
            case 3 -> LocalTime.of(16, 30);
            case 4 -> LocalTime.of(19, 15);
            default -> horaireDebutParDefaut(seance).plusMinutes(150);
        };
    }

    private void validerHoraires() {
        if (this.heureFin != null && this.heureDebut != null) {
            if (this.heureFin.isBefore(this.heureDebut) || this.heureFin.equals(this.heureDebut)) {
                throw new IllegalArgumentException(
                        "L'heure de fin (" + this.heureFin + ") doit être strictement postérieure à l'heure de début (" + this.heureDebut + ")");
            }
        }
    }

    private static int validerPositif(int valeur, String nomChamp) {
        if (valeur <= 0) {
            throw new IllegalArgumentException(nomChamp + " doit être strictement positif");
        }
        return valeur;
    }

    public void assignerEnseignant(UUID enseignantId) {
        if (!STATUTS_ASSIGNABLES.contains(statut)) {
            throw new IllegalStateException(
                    "Impossible d'assigner un enseignant : le créneau est " + statut);
        }
        this.enseignantId = Objects.requireNonNull(enseignantId, "enseignantId ne peut pas être nul");
        this.statut = StatutAffectation.ASSIGNEE;
    }

    public void marquerEffectuee() {
        if (statut != StatutAffectation.ASSIGNEE) {
            throw new IllegalStateException(
                    "Impossible de marquer effectuée : le créneau est " + statut
                            + " (un enseignant doit être assigné au préalable)");
        }
        this.statut = StatutAffectation.EFFECTUEE;
    }

    public void annulerEffectuee() {
        if (statut != StatutAffectation.EFFECTUEE) {
            throw new IllegalStateException(
                    "Impossible d'annuler le marquage effectuée : le créneau est " + statut);
        }
        this.statut = StatutAffectation.ASSIGNEE;
    }

    public void desassignerEnseignant() {
        if (statut != StatutAffectation.ASSIGNEE) {
            throw new IllegalStateException(
                    "Impossible de désassigner : le créneau est " + statut);
        }
        this.enseignantId = null;
        this.statut = StatutAffectation.PLANIFIEE;
    }

    public void modifierMatiere(UUID nouvelleMatiereId) {
        if (statut == StatutAffectation.EFFECTUEE || statut == StatutAffectation.ANNULEE) {
            throw new IllegalStateException(
                    "Impossible de modifier la matière : le créneau est " + statut);
        }
        this.matiereId = Objects.requireNonNull(nouvelleMatiereId, "matiereId ne peut pas être nul");
        this.enseignantId = null;
        this.statut = StatutAffectation.PLANIFIEE;
    }

    public void annuler() {
        if (statut == StatutAffectation.EFFECTUEE || statut == StatutAffectation.ANNULEE) {
            throw new IllegalStateException(
                    "Impossible d'annuler : le créneau est déjà " + statut);
        }
        this.statut = StatutAffectation.ANNULEE;
    }

    public void marquerProgrammee(UUID fichePaieId, java.math.BigDecimal coutApplique) {
        if (this.statut != StatutAffectation.EFFECTUEE) {
            throw new IllegalStateException("Seule une séance EFFECTUEE peut être programmée pour paiement");
        }
        if (this.statutPaiement != StatutPaiement.NON_PAYEE) {
            throw new IllegalStateException("La séance a déjà été programmée ou payée (statut: " + this.statutPaiement + ")");
        }
        this.statutPaiement = StatutPaiement.PROGRAMMEE;
        this.fichePaieId = Objects.requireNonNull(fichePaieId, "fichePaieId ne peut pas être nul");
        this.coutApplique = Objects.requireNonNull(coutApplique, "coutApplique ne peut pas être nul");
    }

    public void marquerPayee() {
        if (this.statutPaiement == StatutPaiement.PAYEE) {
            return; // Déjà payée, idempotent
        }
        if (this.statutPaiement != StatutPaiement.PROGRAMMEE) {
            throw new IllegalStateException("La séance doit être PROGRAMMEE pour être marquée PAYEE (statut actuel: " + this.statutPaiement + ")");
        }
        this.statutPaiement = StatutPaiement.PAYEE;
    }

    public void setHoraires(LocalTime heureDebut, LocalTime heureFin) {
        if (heureDebut != null && heureFin != null) {
            if (heureFin.isBefore(heureDebut) || heureFin.equals(heureDebut)) {
                throw new IllegalArgumentException(
                        "L'heure de fin (" + heureFin + ") doit être strictement postérieure à l'heure de début (" + heureDebut + ")");
            }
            this.heureDebut = heureDebut;
            this.heureFin = heureFin;
        }
    }

    public void setDateSeance(LocalDate dateSeance) {
        this.dateSeance = dateSeance;
    }

    public UUID getId() {
        return id;
    }

    public UUID getCentreId() {
        return centreId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public UUID getFormationId() {
        return formationId;
    }

    public UUID getSalleId() {
        return salleId;
    }

    public UUID getMatiereId() {
        return matiereId;
    }

    public UUID getEnseignantId() {
        return enseignantId;
    }

    public Jour getJour() {
        return jour;
    }

    public int getSeance() {
        return seance;
    }

    public int getSemaine() {
        return semaine;
    }

    public StatutAffectation getStatut() {
        return statut;
    }

    public StatutPaiement getStatutPaiement() {
        return statutPaiement;
    }

    public java.math.BigDecimal getCoutApplique() {
        return coutApplique;
    }

    public UUID getFichePaieId() {
        return fichePaieId;
    }

    public LocalDate getDateSeance() {
        return dateSeance;
    }

    public LocalTime getHeureDebut() {
        return heureDebut != null ? heureDebut : horaireDebutParDefaut(this.seance);
    }

    public LocalTime getHeureFin() {
        return heureFin != null ? heureFin : horaireFinParDefaut(this.seance);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Affectation affectation)) return false;
        return Objects.equals(id, affectation.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
