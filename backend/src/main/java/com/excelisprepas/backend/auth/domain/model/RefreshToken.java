package com.excelisprepas.backend.auth.domain.model;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Trace en base d'un refresh token émis à un utilisateur. On ne stocke
 * jamais le token en clair (tokenHash = SHA-256 de la valeur envoyée au
 * client) : posséder une ligne de cette table ne permet pas d'usurper le
 * token, seul le client qui a reçu la valeur en clair peut s'en servir.
 *
 * revoquer() est le mécanisme de déconnexion réelle : contrairement à
 * l'access token JWT (stateless, valide jusqu'à expiration quoi qu'il
 * arrive), un refresh token révoqué ne permet plus d'obtenir de nouvel
 * access token dès l'appel suivant à /api/auth/refresh.
 */
public class RefreshToken {

    private final UUID id;
    private final UUID utilisateurId;
    private final String tokenHash;
    private final Instant dateExpiration;
    private Instant dateRevocation;

    public RefreshToken(UUID id, UUID utilisateurId, String tokenHash,
                        Instant dateExpiration, Instant dateRevocation) {
        this.id = Objects.requireNonNull(id, "id ne peut pas être nul");
        this.utilisateurId = Objects.requireNonNull(utilisateurId, "utilisateurId ne peut pas être nul");
        this.tokenHash = Objects.requireNonNull(tokenHash, "tokenHash ne peut pas être nul");
        this.dateExpiration = Objects.requireNonNull(dateExpiration, "dateExpiration ne peut pas être nulle");
        this.dateRevocation = dateRevocation;
    }

    public static RefreshToken creer(UUID utilisateurId, String tokenHash, Instant dateExpiration) {
        return new RefreshToken(UUID.randomUUID(), utilisateurId, tokenHash, dateExpiration, null);
    }

    public void revoquer() {
        this.dateRevocation = Instant.now();
    }

    public boolean estValide(Instant maintenant) {
        return dateRevocation == null && maintenant.isBefore(dateExpiration);
    }

    public UUID getId() {
        return id;
    }

    public UUID getUtilisateurId() {
        return utilisateurId;
    }

    public String getTokenHash() {
        return tokenHash;
    }

    public Instant getDateExpiration() {
        return dateExpiration;
    }

    public Instant getDateRevocation() {
        return dateRevocation;
    }
}
