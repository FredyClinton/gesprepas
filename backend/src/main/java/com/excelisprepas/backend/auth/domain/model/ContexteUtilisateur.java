package com.excelisprepas.backend.auth.domain.model;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

/**
 * Les permissions effectives d'un utilisateur authentifié pour la session
 * académique active : celles de son rôle global (Utilisateur.role, valables
 * partout) et celles de ses AttributionRole centre-scopées pour cette
 * session (valables seulement sur son unique centre de rattachement -
 * RattachementRoleService garantit qu'un utilisateur n'a qu'un centre par
 * session).
 *
 * Construit par ContexteUtilisateurPort à partir du SecurityContext et d'une
 * relecture en base des attributions courantes - jamais depuis le JWT
 * directement, pour ne pas figer des droits qui peuvent changer en cours de
 * session (cf. décision : révocation via refresh token, pas de claims
 * d'autorisation dans l'access token).
 */
public class ContexteUtilisateur {

    private final UUID utilisateurId;
    private final Set<Permission> permissionsGlobales;
    private final UUID centreId;
    private final Set<Permission> permissionsCentre;

    public ContexteUtilisateur(UUID utilisateurId, Set<Permission> permissionsGlobales,
                                UUID centreId, Set<Permission> permissionsCentre) {
        this.utilisateurId = Objects.requireNonNull(utilisateurId, "utilisateurId ne peut pas être nul");
        this.permissionsGlobales = Set.copyOf(permissionsGlobales);
        this.centreId = centreId;
        this.permissionsCentre = Set.copyOf(permissionsCentre);
    }

    /**
     * Construit le contexte à partir du rôle global de l'utilisateur et de
     * ses attributions pour la session académique active. Un rôle
     * d'attribution centre-scopé (estCentreScope()) accorde ses permissions
     * uniquement sur centreRattache ; un rôle d'attribution non centre-scopé
     * les accorde globalement, au même titre que le rôle global.
     *
     * roleGlobal lui-même peut être centre-scopé : pour CHEF_CENTRE/CAISSIER/
     * CHARGE_DOSSIER, Utilisateur.role porte la même valeur que leur
     * AttributionRole (cf. DatabaseSeeder.creerUtilisateurEtRattacher) - donc
     * roleGlobal suit la même règle estCentreScope() que les attributions,
     * il n'est pas automatiquement global.
     */
    public static ContexteUtilisateur depuis(UUID utilisateurId, RoleUtilisateur roleGlobal,
                                              UUID centreRattache, List<AttributionRole> attributionsSessionActive) {
        Set<Permission> globales = new HashSet<>();
        Set<Permission> centre = new HashSet<>();

        Set<Permission> permissionsRoleGlobal = MatricePermissions.permissionsDe(roleGlobal);
        if (roleGlobal.estCentreScope()) {
            centre.addAll(permissionsRoleGlobal);
        } else {
            globales.addAll(permissionsRoleGlobal);
        }

        for (AttributionRole attribution : attributionsSessionActive) {
            Set<Permission> permissionsRole = MatricePermissions.permissionsDe(attribution.getRole());
            if (attribution.getRole().estCentreScope()) {
                centre.addAll(permissionsRole);
            } else {
                globales.addAll(permissionsRole);
            }
        }

        return new ContexteUtilisateur(utilisateurId, globales, centreRattache, centre);
    }

    public UUID getUtilisateurId() {
        return utilisateurId;
    }

    /** Vrai si la permission est accordée quel que soit le centre concerné. */
    public boolean possede(Permission permission) {
        return permissionsGlobales.contains(permission);
    }

    /** Vrai si la permission est accordée, globalement ou pour ce centre précis. */
    public boolean possedePourCentre(Permission permission, UUID centreCible) {
        if (possede(permission)) {
            return true;
        }
        return centreId != null && centreId.equals(centreCible) && permissionsCentre.contains(permission);
    }
}
