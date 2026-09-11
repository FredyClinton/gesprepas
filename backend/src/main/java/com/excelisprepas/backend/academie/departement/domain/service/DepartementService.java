package com.excelisprepas.backend.academie.departement.domain.service;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.exception.DepartementAvecRosterException;
import com.excelisprepas.backend.academie.departement.domain.exception.DepartementMatiereUtiliseeException;
import com.excelisprepas.backend.academie.departement.domain.model.Departement;
import com.excelisprepas.backend.academie.departement.domain.port.in.*;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.model.Matiere;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.DepartementIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@Slf4j
public class DepartementService implements CreerDepartementUseCase, RecupererDepartementUseCase,
        ListerDepartementsUseCase, RenommerDepartementUseCase, SupprimerDepartementUseCase,
        AssignerChefDepartementUseCase {

    private final DepartementRepositoryPort departementRepository;
    private final MatiereRepositoryPort matiereRepository;
    private final AffectationDepartementaleRepositoryPort rosterRepository;
    private final AffectationRepositoryPort affectationRepository;
    private final ProgressionRepositoryPort progressionRepository;
    private final FormationRepositoryPort formationRepository;
    private final UtilisateurRepositoryPort utilisateurRepository;

    public DepartementService(DepartementRepositoryPort departementRepository,
                              MatiereRepositoryPort matiereRepository,
                              AffectationDepartementaleRepositoryPort rosterRepository,
                              AffectationRepositoryPort affectationRepository,
                              ProgressionRepositoryPort progressionRepository,
                              FormationRepositoryPort formationRepository,
                              UtilisateurRepositoryPort utilisateurRepository) {
        this.departementRepository = departementRepository;
        this.matiereRepository = matiereRepository;
        this.rosterRepository = rosterRepository;
        this.affectationRepository = affectationRepository;
        this.progressionRepository = progressionRepository;
        this.formationRepository = formationRepository;
        this.utilisateurRepository = utilisateurRepository;
    }

    @Override
    public Departement creerDepartement(String nomDepartement, String nomMatiere) {
        return creerDepartement(nomDepartement, nomMatiere, null);
    }

    @Override
    public Departement creerDepartement(String nomDepartement, String nomMatiere, String couleur) {
        UUID matiereId = UUID.randomUUID();
        Matiere matiere = new Matiere(matiereId, nomMatiere, couleur);
        Departement departement = new Departement(UUID.randomUUID(), nomDepartement, matiereId);

        matiereRepository.save(matiere);
        departement = departementRepository.save(departement);
        log.info("Département créé : id={}, nom={}, matiereId={}, couleur={}", departement.getId(), nomDepartement, matiereId, couleur);
        return departement;
    }

    @Override
    public Departement recupererDepartement(UUID id) {
        return departementRepository.findById(id)
                .orElseThrow(() -> new DepartementIntrouvableException(id));
    }

    @Override
    public List<Departement> listerDepartements() {
        return departementRepository.findAll();
    }

    @Override
    public Departement renommerDepartement(UUID id, String nouveauNom) {
        Departement departement = recupererDepartement(id);
        departement.renommer(nouveauNom);
        departement = departementRepository.save(departement);
        log.info("Département renommé : id={}, nouveauNom={}", id, nouveauNom);
        return departement;
    }

    @Override
    public void supprimerDepartement(UUID id) {
        Departement departement = recupererDepartement(id);
        UUID matiereId = departement.getMatiereId();

        // Garde-fou 1 : Des enseignants sont-ils encore dans le roster du département ?
        if (rosterRepository != null && rosterRepository.existsByDepartementId(id)) {
            log.warn("Suppression du département refusée : id={} a encore des enseignants rattachés dans le roster", id);
            throw new DepartementAvecRosterException(id);
        }

        // Garde-fou 2 : La matière associée est-elle utilisée dans des cours, progressions ou formations ?
        boolean matiereUtilisee = (affectationRepository != null && affectationRepository.existsByMatiereId(matiereId))
                || (progressionRepository != null && progressionRepository.existsByMatiereId(matiereId))
                || (formationRepository != null && formationRepository.existsByMatiereId(matiereId));

        if (matiereUtilisee) {
            log.warn("Suppression du département refusée : matière id={} encore référencée ailleurs", matiereId);
            throw new DepartementMatiereUtiliseeException(id, matiereId);
        }

        // Détachement automatique du chef assigné à ce département (via le chefId du
        // département lui-même, pas une recherche inverse sur Utilisateur.departementId -
        // voir assignerChef ci-dessous pour le détail de pourquoi ce champ legacy n'est
        // pas fiable pour un chef qui dirige plusieurs départements).
        UUID chefActuelId = departement.getChefId();
        if (utilisateurRepository != null && chefActuelId != null) {
            utilisateurRepository.findById(chefActuelId).ifPresent(chef -> {
                if (id.equals(chef.getDepartementId())) {
                    chef.detacherDuDepartement();
                    utilisateurRepository.save(chef);
                }
                log.info("Chef {} détaché suite à la suppression du département {}", chefActuelId, id);
            });
        }

        departementRepository.deleteById(id);

        try {
            matiereRepository.deleteById(matiereId);
            log.info("Matière orpheline supprimée avec succès : id={}", matiereId);
        } catch (Exception e) {
            log.warn("Impossible de supprimer la matière associée id={}: {}", matiereId, e.getMessage());
        }

        log.info("Département supprimé : id={}", id);
    }

    @Override
    public void assignerChef(UUID departementId, UUID utilisateurId) {
        Departement departement = recupererDepartement(departementId);
        UUID ancienChefId = departement.getChefId();

        // 1. Détacher l'ancien chef du département s'il change. On repart du chefId
        //    porté par CE département (source de vérité, many-to-one : plusieurs
        //    départements peuvent partager le même chef) plutôt que d'une recherche
        //    inverse via Utilisateur.departementId - ce champ legacy est un simple
        //    scalaire à valeur unique par utilisateur, donc inutilisable pour
        //    retrouver "le chef de CE département" dès qu'un chef en dirige
        //    plusieurs (son departementId ne pointe alors que sur le dernier
        //    département assigné, pas sur celui-ci).
        if (utilisateurRepository != null && ancienChefId != null && !ancienChefId.equals(utilisateurId)) {
            utilisateurRepository.findById(ancienChefId).ifPresent(ancienChef -> {
                // Ne nettoyer le champ legacy que s'il pointe encore vers CE département :
                // sinon on risquerait d'effacer le rattachement affiché pour un AUTRE
                // département que ce même chef dirige toujours.
                if (departementId.equals(ancienChef.getDepartementId())) {
                    ancienChef.detacherDuDepartement();
                    utilisateurRepository.save(ancienChef);
                }
                log.info("Ancien chef {} retiré du département {}", ancienChefId, departementId);
            });
        }

        // 2. Assigner le nouveau chef si spécifié
        if (utilisateurId != null) {
            if (utilisateurRepository != null) {
                Utilisateur nouvelUtilisateur = utilisateurRepository.findById(utilisateurId)
                        .orElseThrow(() -> new IllegalArgumentException("Utilisateur introuvable : " + utilisateurId));

                if (nouvelUtilisateur.getRole() != RoleUtilisateur.CHEF_DEPARTEMENT) {
                    throw new IllegalArgumentException("L'utilisateur doit posséder le rôle CHEF_DEPARTEMENT pour être assigné à ce département");
                }

                // Le champ legacy departementId ne porte qu'une seule valeur : on ne
                // l'écrase pas s'il est déjà rattaché à un AUTRE département (chef
                // multi-départements), pour ne pas faire perdre ce rattachement - le
                // département.chefId (mis à jour juste en dessous) reste la source de
                // vérité utilisée partout ailleurs (dashboard, planification, etc.).
                if (nouvelUtilisateur.getDepartementId() == null
                        || nouvelUtilisateur.getDepartementId().equals(departementId)) {
                    nouvelUtilisateur.rattacherADepartement(departementId);
                    utilisateurRepository.save(nouvelUtilisateur);
                }
            }
            departement.assignerChef(utilisateurId);
            log.info("Chef {} assigné avec succès au département {}", utilisateurId, departementId);
        } else {
            departement.retirerChef();
            log.info("Chef retiré du département {}", departementId);
        }

        departementRepository.save(departement);
    }
}