package com.excelisprepas.backend.rattachement.domain.model;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

import java.util.Objects;
import java.util.UUID;

/**
 * Un rôle tenu par un Utilisateur durant une SessionAcademique. Un même
 * utilisateur peut cumuler plusieurs AttributionRole pour la même session
 * (ex : Chef de centre + Chargé de dossier au même centre, ou Directeur +
 * Comptable sans centre). Immuable — pas de "changerRole" : on retire et
 * on ajoute plutôt que de muter, ce qui garde l'historique de chaque
 * attribution explicite.
 */
public class AttributionRole {

    private final UUID id;
    private final UUID utilisateurId;
    private final UUID sessionId;
    private final RoleUtilisateur role;

    public AttributionRole(UUID id, UUID utilisateurId, UUID sessionId, RoleUtilisateur role) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.utilisateurId = Objects.requireNonNull(utilisateurId, "utilisateurId ne peut pas être nul");
        this.sessionId = Objects.requireNonNull(sessionId, "sessionId ne peut pas être nul");
        this.role = Objects.requireNonNull(role, "role ne peut pas être nul");
    }

    public UUID getId() {
        return id;
    }

    public UUID getUtilisateurId() {
        return utilisateurId;
    }

    public UUID getSessionId() {
        return sessionId;
    }

    public RoleUtilisateur getRole() {
        return role;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AttributionRole that)) return false;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}