package com.excelisprepas.backend.auth.domain.port.out;

import com.excelisprepas.backend.auth.domain.model.RefreshToken;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepositoryPort {
    RefreshToken save(RefreshToken refreshToken);

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /** Révoque tous les refresh tokens encore actifs de l'utilisateur (déconnexion de toutes ses sessions). */
    void revoquerTousPourUtilisateur(UUID utilisateurId, Instant dateRevocation);
}
