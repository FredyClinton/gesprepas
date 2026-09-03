package com.excelisprepas.backend.shared.seed;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.port.in.AssignerEnseignantUseCase;
import com.excelisprepas.backend.academie.affectation.domain.port.in.CreerCreneauUseCase;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.in.AjouterEnseignantUseCase;
import com.excelisprepas.backend.apprenant.domain.model.Apprenant;
import com.excelisprepas.backend.apprenant.domain.port.in.CreerApprenantUseCase;
import com.excelisprepas.backend.inscription.domain.port.in.CreerDossierInscriptionUseCase;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.in.CreerCentreUseCase;
import com.excelisprepas.backend.centre.domain.port.in.RejoindreSessionUseCase;
import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.in.CreerDepartementUseCase;
import com.excelisprepas.backend.dossier.domain.model.Concours;
import com.excelisprepas.backend.dossier.domain.model.Dossier;
import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.model.SelectionPiece;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import com.excelisprepas.backend.financier.domain.port.in.CreerMotifUseCase;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.academie.formation.domain.model.Formation;
import com.excelisprepas.backend.academie.formation.domain.port.in.CreerFormationUseCase;
import com.excelisprepas.backend.personnel.domain.model.Enseignant;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.CreerEnseignantUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.CreerUtilisateurUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.RattacherCentreUseCase;
import com.excelisprepas.backend.academie.progression.domain.port.in.CreerProgressionUseCase;
import com.excelisprepas.backend.rattachement.domain.port.in.RattacherUtilisateurUseCase;
import com.excelisprepas.backend.academie.salle.domain.model.Salle;
import com.excelisprepas.backend.academie.salle.domain.port.in.CreerSalleUseCase;
import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.port.in.CloturerSessionUseCase;
import com.excelisprepas.backend.session.domain.port.in.CreerSessionAcademiqueUseCase;
import com.excelisprepas.backend.session.domain.port.in.DemarrerSessionUseCase;
import com.excelisprepas.backend.session.domain.port.in.ListerSessionsUseCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Component
@Profile("seed")
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);
    private static final String MOT_DE_PASSE_SEED = "password123";

    private final ListerSessionsUseCase listerSessionsUseCase;
    private final CreerSessionAcademiqueUseCase creerSessionAcademiqueUseCase;
    private final DemarrerSessionUseCase demarrerSessionUseCase;
    private final CloturerSessionUseCase cloturerSessionUseCase;
    private final CreerCentreUseCase creerCentreUseCase;
    private final RejoindreSessionUseCase rejoindreSessionUseCase;
    private final CreerDepartementUseCase creerDepartementUseCase;
    private final CreerFormationUseCase creerFormationUseCase;
    private final com.excelisprepas.backend.abonnement.domain.port.in.AbonnerCentreFormationUseCase abonnerCentreFormationUseCase;
    private final CreerSalleUseCase creerSalleUseCase;
    private final CreerUtilisateurUseCase creerUtilisateurUseCase;
    private final RattacherCentreUseCase rattacherCentreUseCase;
        private final RattacherUtilisateurUseCase rattacherUtilisateurUseCase;
    private final CreerEnseignantUseCase creerEnseignantUseCase;
    private final AjouterEnseignantUseCase ajouterEnseignantUseCase;
    private final CreerApprenantUseCase creerApprenantUseCase;
    private final CreerDossierInscriptionUseCase creerDossierInscriptionUseCase;
    private final CreerCreneauUseCase creerCreneauUseCase;
    private final AssignerEnseignantUseCase assignerEnseignantUseCase;
    private final CreerProgressionUseCase creerProgressionUseCase;
    private final CreerMotifUseCase creerMotifUseCase;
    private final SaisirEntreeUseCase saisirEntreeUseCase;
    private final SaisirSortieUseCase saisirSortieUseCase;
    private final CreerPieceRequiseUseCase creerPieceRequiseUseCase;
    private final CreerConcoursUseCase creerConcoursUseCase;
    private final AjouterPieceAuConcoursUseCase ajouterPieceAuConcoursUseCase;
    private final OuvrirDossierUseCase ouvrirDossierUseCase;
    private final AjouterConcoursAuDossierUseCase ajouterConcoursAuDossierUseCase;
    private final EnregistrerPaiementDossierUseCase enregistrerPaiementDossierUseCase;
    private final com.excelisprepas.backend.academie.phase.domain.port.out.PhaseRepositoryPort phaseRepositoryPort;

    public DatabaseSeeder(ListerSessionsUseCase listerSessionsUseCase,
                          CreerSessionAcademiqueUseCase creerSessionAcademiqueUseCase,
                          DemarrerSessionUseCase demarrerSessionUseCase,
                          CloturerSessionUseCase cloturerSessionUseCase,
                          CreerCentreUseCase creerCentreUseCase,
                          RejoindreSessionUseCase rejoindreSessionUseCase,
                          CreerDepartementUseCase creerDepartementUseCase,
                          CreerFormationUseCase creerFormationUseCase,
                          com.excelisprepas.backend.abonnement.domain.port.in.AbonnerCentreFormationUseCase abonnerCentreFormationUseCase,
                          CreerSalleUseCase creerSalleUseCase,
                          CreerUtilisateurUseCase creerUtilisateurUseCase,
                          RattacherCentreUseCase rattacherCentreUseCase,
                                                    RattacherUtilisateurUseCase rattacherUtilisateurUseCase,
                          CreerEnseignantUseCase creerEnseignantUseCase,
                          AjouterEnseignantUseCase ajouterEnseignantUseCase,
                          CreerApprenantUseCase creerApprenantUseCase,
                          CreerDossierInscriptionUseCase creerDossierInscriptionUseCase,
                          CreerCreneauUseCase creerCreneauUseCase,
                          AssignerEnseignantUseCase assignerEnseignantUseCase,
                          CreerProgressionUseCase creerProgressionUseCase,
                          CreerMotifUseCase creerMotifUseCase,
                          SaisirEntreeUseCase saisirEntreeUseCase,
                          SaisirSortieUseCase saisirSortieUseCase,
                          CreerPieceRequiseUseCase creerPieceRequiseUseCase,
                          CreerConcoursUseCase creerConcoursUseCase,
                          AjouterPieceAuConcoursUseCase ajouterPieceAuConcoursUseCase,
                          OuvrirDossierUseCase ouvrirDossierUseCase,
                          AjouterConcoursAuDossierUseCase ajouterConcoursAuDossierUseCase,
                          EnregistrerPaiementDossierUseCase enregistrerPaiementDossierUseCase,
                          com.excelisprepas.backend.academie.phase.domain.port.out.PhaseRepositoryPort phaseRepositoryPort) {
        this.listerSessionsUseCase = listerSessionsUseCase;
        this.creerSessionAcademiqueUseCase = creerSessionAcademiqueUseCase;
        this.demarrerSessionUseCase = demarrerSessionUseCase;
        this.cloturerSessionUseCase = cloturerSessionUseCase;
        this.creerCentreUseCase = creerCentreUseCase;
        this.rejoindreSessionUseCase = rejoindreSessionUseCase;
        this.creerDepartementUseCase = creerDepartementUseCase;
        this.creerFormationUseCase = creerFormationUseCase;
        this.abonnerCentreFormationUseCase = abonnerCentreFormationUseCase;
        this.creerSalleUseCase = creerSalleUseCase;
        this.creerUtilisateurUseCase = creerUtilisateurUseCase;
        this.rattacherCentreUseCase = rattacherCentreUseCase;
                this.rattacherUtilisateurUseCase = rattacherUtilisateurUseCase;
        this.creerEnseignantUseCase = creerEnseignantUseCase;
        this.ajouterEnseignantUseCase = ajouterEnseignantUseCase;
        this.creerApprenantUseCase = creerApprenantUseCase;
        this.creerDossierInscriptionUseCase = creerDossierInscriptionUseCase;
        this.creerCreneauUseCase = creerCreneauUseCase;
        this.assignerEnseignantUseCase = assignerEnseignantUseCase;
        this.creerProgressionUseCase = creerProgressionUseCase;
        this.creerMotifUseCase = creerMotifUseCase;
        this.saisirEntreeUseCase = saisirEntreeUseCase;
        this.saisirSortieUseCase = saisirSortieUseCase;
        this.creerPieceRequiseUseCase = creerPieceRequiseUseCase;
        this.creerConcoursUseCase = creerConcoursUseCase;
        this.ajouterPieceAuConcoursUseCase = ajouterPieceAuConcoursUseCase;
        this.ouvrirDossierUseCase = ouvrirDossierUseCase;
        this.ajouterConcoursAuDossierUseCase = ajouterConcoursAuDossierUseCase;
        this.enregistrerPaiementDossierUseCase = enregistrerPaiementDossierUseCase;
        this.phaseRepositoryPort = phaseRepositoryPort;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!listerSessionsUseCase.listerSessions().isEmpty()) {
            log.warn("Des sessions académiques existent déjà : seed ignoré pour éviter les doublons.");
            return;
        }

        log.info("Démarrage du seed de la base de données...");

        SessionAcademique sessionCloturee = seedSessionCloturee();
        SessionAcademique sessionEnCours = seedSessionEnCours();
        SessionAcademique sessionPlanifiee = seedSessionPlanifiee();

        List<Centre> centres = seedCentres(sessionEnCours.getId(), sessionPlanifiee.getId());
        List<DepartementSeed> departements = seedDepartements();

        com.excelisprepas.backend.academie.phase.domain.model.Phase phase1 = new com.excelisprepas.backend.academie.phase.domain.model.Phase(UUID.randomUUID(), "PHASE_1", "Phase 1 - Classique");
        com.excelisprepas.backend.academie.phase.domain.model.Phase phase2 = new com.excelisprepas.backend.academie.phase.domain.model.Phase(UUID.randomUUID(), "PHASE_2", "Phase 2 - Intensive");
        phaseRepositoryPort.save(phase1);
        phaseRepositoryPort.save(phase2);

        List<FormationSeed> formations = seedFormationsEtSalles(centres, departements, sessionEnCours.getId(), phase1.getId());

        seedPersonnelDirection();
        seedChefsDepartement(departements);
        List<CentreSeed> centresSeed = seedPersonnelParCentre(centres, sessionEnCours.getId());

        DepartementSeed mathematiques = departements.get(0);
        Map<UUID, List<UUID>> enseignantsParDepartement = seedEnseignants(departements, sessionEnCours.getId());
        List<UUID> apprenantsIds = seedApprenants(formations, sessionEnCours.getId());

        seedProgressions(formations, mathematiques, sessionEnCours.getId(), phase1.getId());
        seedAffectations(formations, departements, enseignantsParDepartement, sessionEnCours.getId());
        seedFinancier(centresSeed, sessionEnCours.getId(), apprenantsIds);

        seedDossier(sessionEnCours.getId(), apprenantsIds, centresSeed.get(0).caissierId(), formations, phase1.getId());

        log.info("Seed terminé : sessions {} (CLOTUREE) / {} (EN_COURS) / {} (PLANIFIEE), {} centres, "
                        + "{} départements, {} formations/salles, {} apprenants. Connexion : "
                        + "email d'un chef de centre (ex: centre1.chef@excelis.cm) + mot de passe \"{}\".",
                sessionCloturee.getAnnee(), sessionEnCours.getAnnee(), sessionPlanifiee.getAnnee(),
                centres.size(), departements.size(), formations.size(), apprenantsIds.size(), MOT_DE_PASSE_SEED);
    }

    private SessionAcademique seedSessionCloturee() {
        SessionAcademique session = creerSessionAcademiqueUseCase.creerSession(
                "2024-2025", LocalDate.of(2024, 9, 1), LocalDate.of(2025, 7, 31));
        demarrerSessionUseCase.demarrerSession(session.getId());
        return cloturerSessionUseCase.cloturerSession(session.getId());
    }

    private SessionAcademique seedSessionEnCours() {
        SessionAcademique session = creerSessionAcademiqueUseCase.creerSession(
                "2025-2026", LocalDate.of(2025, 9, 1), LocalDate.of(2026, 7, 31));
        return demarrerSessionUseCase.demarrerSession(session.getId());
    }

    private SessionAcademique seedSessionPlanifiee() {
        return creerSessionAcademiqueUseCase.creerSession(
                "2026-2027", LocalDate.of(2026, 9, 1), LocalDate.of(2027, 7, 31));
    }

    private List<Centre> seedCentres(UUID sessionEnCoursId, UUID sessionPlanifieeId) {
        List<Centre> centres = new ArrayList<>();
        centres.add(creerCentreUseCase.creerCentre("Centre Yaoundé", "Avenue Kennedy", "Yaoundé"));
        centres.add(creerCentreUseCase.creerCentre("Centre Douala", "Rue Joss", "Douala"));
        centres.add(creerCentreUseCase.creerCentre("Centre Bafoussam", "Avenue de l'Indépendance", "Bafoussam"));

        for (Centre centre : centres) {
            rejoindreSessionUseCase.rejoindreSession(centre.getId(), sessionEnCoursId);
            rejoindreSessionUseCase.rejoindreSession(centre.getId(), sessionPlanifieeId);
        }
        return centres;
    }

    private List<DepartementSeed> seedDepartements() {
        List<DepartementSeed> departements = new ArrayList<>();
        for (String nom : List.of("Mathématiques", "Physique-Chimie", "Français", "Anglais",
                "Sciences de la Vie et de la Terre")) {
            Departement departement = creerDepartementUseCase.creerDepartement(nom, nom);
            departements.add(new DepartementSeed(departement.getId(), departement.getMatiereId(), nom));
        }
        return departements;
    }

    private List<FormationSeed> seedFormationsEtSalles(List<Centre> centres, List<DepartementSeed> departements, UUID sessionEnCoursId, UUID phaseId) {
        List<FormationSeed> formations = new ArrayList<>();
        Map<String, Formation> formationsParNom = new HashMap<>();
        Set<UUID> toutesMatieres = new java.util.HashSet<>();
        for (DepartementSeed dep : departements) {
            toutesMatieres.add(dep.matiereId());
        }

        for (String nomFormation : List.of("Terminale C", "Terminale D")) {
            formationsParNom.put(nomFormation, creerFormationUseCase.creerFormation(nomFormation, toutesMatieres));
        }

        for (Centre centre : centres) {
            for (String nomFormation : List.of("Terminale C", "Terminale D")) {
                Formation formation = formationsParNom.get(nomFormation);
                abonnerCentreFormationUseCase.abonnerCentre(centre.getId(), formation.getId(), sessionEnCoursId);
                Salle salle = creerSalleUseCase.creerSalle(
                        centre.getNom() + " - " + nomFormation + " - Salle 1",
                        centre.getId(), sessionEnCoursId, formation.getId(), phaseId);
                formations.add(new FormationSeed(formation.getId(), salle.getId(), centre.getId(), centre.getNom()));
            }
        }
        return formations;
    }

    private void seedPersonnelDirection() {
        creerUtilisateurUseCase.creerUtilisateur("Mballa", "Jean", "jean.mballa@excelis.cm",
                MOT_DE_PASSE_SEED, RoleUtilisateur.DIRECTEUR);
        creerUtilisateurUseCase.creerUtilisateur("Ngo", "Marie", "marie.ngo@excelis.cm",
                MOT_DE_PASSE_SEED, RoleUtilisateur.DIRECTEUR_ACADEMIQUE);
        creerUtilisateurUseCase.creerUtilisateur("Eto'o", "Paul", "paul.etoo@excelis.cm",
                MOT_DE_PASSE_SEED, RoleUtilisateur.COMPTABLE);
        creerUtilisateurUseCase.creerUtilisateur("Fokou", "Alice", "alice.fokou@excelis.cm",
                MOT_DE_PASSE_SEED, RoleUtilisateur.SUPERVISEUR_DOSSIERS);
    }

    private void seedChefsDepartement(List<DepartementSeed> departements) {
        String[] noms = {"Nkeng", "Mbia", "Essomba", "Nya", "Fouda"};
        String[] prenoms = {"Robert", "Solange", "Patrice", "Diane", "Blaise"};

        for (int i = 0; i < departements.size(); i++) {
            DepartementSeed departement = departements.get(i);
            String email = "departement%d.chef@excelis.cm".formatted(i + 1);
            Utilisateur utilisateur = creerUtilisateurUseCase.creerUtilisateur(
                    noms[i % noms.length], prenoms[i % prenoms.length], email,
                    MOT_DE_PASSE_SEED, RoleUtilisateur.CHEF_DEPARTEMENT);
            // Pas besoin de rattacher le département sur l'utilisateur
        }
    }

    private List<CentreSeed> seedPersonnelParCentre(List<Centre> centres, UUID sessionEnCoursId) {
        List<CentreSeed> resultat = new ArrayList<>();
        int index = 1;
        for (Centre centre : centres) {
            String slug = "centre" + index;
            UUID chefCentreId = creerUtilisateurEtRattacher(
                    "Chef", "Centre " + slug, slug + ".chef@excelis.cm",
                    RoleUtilisateur.CHEF_CENTRE, centre.getId(), sessionEnCoursId);
            UUID caissierId = creerUtilisateurEtRattacher(
                    "Caissier", "Centre " + slug, slug + ".caissier@excelis.cm",
                    RoleUtilisateur.CAISSIER, centre.getId(), sessionEnCoursId);
            creerUtilisateurEtRattacher(
                    "ChargeDossier", "Centre " + slug, slug + ".chargedossier@excelis.cm",
                    RoleUtilisateur.CHARGE_DOSSIER, centre.getId(), sessionEnCoursId);

            resultat.add(new CentreSeed(centre.getId(), centre.getNom(), caissierId));
            index++;
        }
        return resultat;
    }

    private UUID creerUtilisateurEtRattacher(String nom, String prenom, String email,
                                             RoleUtilisateur role, UUID centreId, UUID sessionId) {
        Utilisateur utilisateur = creerUtilisateurUseCase.creerUtilisateur(
                nom, prenom, email, MOT_DE_PASSE_SEED, role);
        rattacherCentreUseCase.rattacherCentre(utilisateur.getId(), centreId);
        rattacherUtilisateurUseCase.rattacher(utilisateur.getId(), sessionId, centreId, Set.of(role));
        return utilisateur.getId();
    }

    private Map<UUID, List<UUID>> seedEnseignants(List<DepartementSeed> departements, UUID sessionEnCoursId) {
        Map<UUID, List<UUID>> enseignantsParDepartement = new HashMap<>();
        String[] noms = {"Kamdem", "Talla", "Biya", "Ateba", "Nguema", "Fomekong", "Onana", "Manga", "Njoya", "Simo"};
        String[] prenoms = {"André", "Chantal", "Éric", "Sophie", "Hervé", "Nadège", "Serge", "Aïcha", "Léa", "Marc"};

        for (int i = 0; i < noms.length; i++) {
            String matricule = "ENS-%03d".formatted(i + 1);
            BigDecimal coutParSeance = BigDecimal.valueOf(5000 + (i % 4) * 1000);
            LocalDate dateRecrutement = LocalDate.of(2021 + (i % 4), 9, 1);
            // null = pas de rôle appelant : le seed n'est pas une action utilisateur, jamais
            // bloqué par le gel de gestion des enseignants.
            Enseignant enseignant = creerEnseignantUseCase.creerEnseignant(null, noms[i], prenoms[i], matricule, coutParSeance,
                    null, null, null, null, dateRecrutement);

            DepartementSeed departement = departements.get(i % departements.size());
            ajouterEnseignantUseCase.ajouterEnseignant(null, departement.departementId(), sessionEnCoursId, enseignant.getId());

            enseignantsParDepartement.computeIfAbsent(departement.departementId(), key -> new ArrayList<>())
                    .add(enseignant.getId());
        }
        return enseignantsParDepartement;
    }

    private List<UUID> seedApprenants(List<FormationSeed> formations, UUID sessionEnCoursId) {
        List<UUID> apprenantIds = new ArrayList<>();
        String[] noms = {"Abena", "Ondoa", "Tchoua", "Bello", "Mfou", "Assam", "Ekani", "Ndzana", "Owona", "Bikoi"};
        String[] prenoms = {"Grace", "Franck", "Judith", "Yannick", "Carine", "Steve", "Rosine", "Junior", "Émilie", "Boris"};
        LocalDate dateInscription = LocalDate.of(2025, 9, 5);

        for (int i = 0; i < formations.size(); i++) {
            FormationSeed formation = formations.get(i);
            for (int j = 0; j < 2; j++) {
                int index = (i * 2 + j) % noms.length;
                LocalDate dateNaissance = LocalDate.of(2007 - (index % 3), 3 + index % 6, 10 + index % 15);
                Apprenant apprenant = creerApprenantUseCase.creerApprenant(
                        noms[index], prenoms[index], dateNaissance, dateInscription,
                        formation.centreId(), null, null, null);
                
                creerDossierInscriptionUseCase.creerDossierInscription(
                        apprenant.getId(), sessionEnCoursId, formation.centreId(),
                        BigDecimal.valueOf(450_000), dateInscription, false, null,
                        List.of(UUID.randomUUID()), List.of(formation.formationId()), List.of()
                );

                apprenantIds.add(apprenant.getId());
            }
        }
        return apprenantIds;
    }

    private void seedProgressions(List<FormationSeed> formations, DepartementSeed mathematiques, UUID sessionEnCoursId, UUID phaseId) {
        int semaine = 1;
        Set<UUID> formationsTraitees = new java.util.HashSet<>();
        for (FormationSeed formation : formations) {
            if (formationsTraitees.add(formation.formationId())) {
                creerProgressionUseCase.creerProgression(formation.formationId(), sessionEnCoursId, phaseId,
                        mathematiques.matiereId(), semaine, 1,
                        "Suites numériques", "Suites arithmétiques et géométriques, convergence",
                        "Exercices 1 à 12 du manuel, série de révision");
            }
        }
    }

    private void seedAffectations(List<FormationSeed> formations, List<DepartementSeed> departements,
                                  Map<UUID, List<UUID>> enseignantsParDepartement, UUID sessionEnCoursId) {
        Jour[] jours = {Jour.LUNDI, Jour.MARDI, Jour.MERCREDI};
        List<DepartementSeed> departementsCreneaux = departements.subList(0, 3);
        Map<UUID, Integer> enseignantIndexParDepartement = new HashMap<>();
        int indexGlobal = 0;

        for (FormationSeed formation : formations) {
            for (int i = 0; i < departementsCreneaux.size(); i++) {
                DepartementSeed departement = departementsCreneaux.get(i);
                var affectation = creerCreneauUseCase.creerCreneau(formation.centreId(), sessionEnCoursId,
                        formation.formationId(), formation.salleId(), departement.matiereId(), jours[i], 1, 1);

                if (indexGlobal % 2 == 0) {
                    List<UUID> enseignants = enseignantsParDepartement.get(departement.departementId());
                    int enseignantIndex = enseignantIndexParDepartement.merge(departement.departementId(), 1, Integer::sum) - 1;
                    UUID enseignantId = enseignants.get(enseignantIndex % enseignants.size());
                    assignerEnseignantUseCase.assignerEnseignant(affectation.getId(), enseignantId);
                }
                indexGlobal++;
            }
        }
    }

    private void seedFinancier(List<CentreSeed> centresSeed, UUID sessionEnCoursId, List<UUID> apprenantIds) {
        Motif fraisScolarite = creerMotifUseCase.creerMotif("Frais de scolarité", TypeMotif.ENTREE);
        Motif achatFournitures = creerMotifUseCase.creerMotif("Achat fournitures", TypeMotif.SORTIE);
        creerMotifUseCase.creerMotif("Salaire enseignant vacataire", TypeMotif.SORTIE);

        int apprenantIndex = 0;
        for (CentreSeed centre : centresSeed) {
            UUID apprenantId = apprenantIndex < apprenantIds.size() ? apprenantIds.get(apprenantIndex) : null;
            saisirEntreeUseCase.saisirEntree(sessionEnCoursId, fraisScolarite.getId(), BigDecimal.valueOf(100_000),
                    LocalDate.of(2025, 10, 1), centre.caissierId(), centre.centreId(), apprenantId, null);
            saisirSortieUseCase.saisirSortie(sessionEnCoursId, achatFournitures.getId(), BigDecimal.valueOf(25_000),
                    LocalDate.of(2025, 10, 5), centre.caissierId(), centre.centreId(), "Papeterie du Centre");
            apprenantIndex += 2;
        }
    }

    private void seedDossier(UUID sessionEnCoursId, List<UUID> apprenantIds, UUID caissierId, List<FormationSeed> formations, UUID phaseId) {
        PieceRequise acteNaissance = creerPieceRequiseUseCase.creerPieceRequise("Acte de naissance", BigDecimal.ZERO);
        PieceRequise certificatMedical = creerPieceRequiseUseCase.creerPieceRequise("Certificat médical", BigDecimal.valueOf(2000));
        Motif fraisConcours = creerMotifUseCase.creerMotif("Frais de concours", TypeMotif.ENTREE);

        UUID formationId = formations.get(0).formationId();
        Concours concours = creerConcoursUseCase.creerConcours("Concours ENSPY", sessionEnCoursId,
                formationId, phaseId, LocalDate.of(2027, 3, 1), LocalDate.of(2027, 2, 15));
        ajouterPieceAuConcoursUseCase.ajouterPieceAuConcours(concours.getId(), acteNaissance.getId());
        ajouterPieceAuConcoursUseCase.ajouterPieceAuConcours(concours.getId(), certificatMedical.getId());

        for (int i = 0; i < Math.min(2, apprenantIds.size()); i++) {
            Dossier dossier = ouvrirDossierUseCase.ouvrirDossier(apprenantIds.get(i), sessionEnCoursId);
            var dossierConcours = ajouterConcoursAuDossierUseCase.ajouterConcoursAuDossier(dossier.getId(), concours.getId(),
                    List.of(new SelectionPiece(acteNaissance.getId(), 1), new SelectionPiece(certificatMedical.getId(), 1)));

            if (i == 0) {
                enregistrerPaiementDossierUseCase.enregistrerPaiementDossier(dossierConcours.getId(), fraisConcours.getId(),
                        BigDecimal.valueOf(15_000), LocalDate.of(2026, 11, 10), caissierId);
            }
        }
    }

    private record DepartementSeed(UUID departementId, UUID matiereId, String nom) {
    }

    private record CentreSeed(UUID centreId, String nom, UUID caissierId) {
    }

    private record FormationSeed(UUID formationId, UUID salleId, UUID centreId, String nomCentre) {
    }
}
