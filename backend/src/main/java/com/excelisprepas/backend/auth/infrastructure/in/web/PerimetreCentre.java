package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

/**
 * Centre effectif d'une lecture de liste. Un rôle rattaché à un centre
 * ({@link RoleUtilisateur#estCentreScope()} : chef de centre, caissier, chargé de dossier) ne lit que son
 * centre, quel que soit le centre demandé ; les rôles globaux lisent le centre demandé (ou tous si null).
 *
 * <p>Le rôle vient du jeton ; le centre est l'en-tête {@code X-Centre-Id} tel que réécrit par
 * {@link EnTetesIdentiteFilter} (rattachement de la session active relu en base), jamais la valeur du client.
 */
public final class PerimetreCentre {

    public static final String EN_TETE_CENTRE = "X-Centre-Id";

    private PerimetreCentre() {
    }

    /**
     * @param centreRattache valeur de l'en-tête {@code X-Centre-Id} (réécrit par le filtre)
     * @param centreDemande  centre demandé par le client, ignoré pour un rôle rattaché à un centre
     * @throws ResponseStatusException 403 si un rôle rattaché à un centre n'a aucun centre pour la session active
     */
    public static UUID centreEffectif(UUID centreRattache, UUID centreDemande) {
        RoleUtilisateur role = UtilisateurCourant.roleOuNull();
        if (role == null || !role.estCentreScope()) {
            return centreDemande;
        }
        if (centreRattache == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Aucun centre n'est associé à votre compte pour la session active.");
        }
        return centreRattache;
    }
}
