package com.excelisprepas.backend.auth.infrastructure.out.security;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.auth.domain.port.out.TokenPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.shared.exception.TokenInvalideException;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtTokenAdapter implements TokenPort {

    private static final String CLAIM_EMAIL = "email";
    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_CENTRE_ID = "centreId";
    private static final String CLAIM_DEPARTEMENT_ID = "departementId";

    private final SecretKey cle;
    private final Duration dureeDeVie;

    public JwtTokenAdapter(@Value("${app.jwt.secret}") String secret,
                            @Value("${app.jwt.access-token-ttl-minutes}") long dureeDeVieMinutes) {
        this.cle = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.dureeDeVie = Duration.ofMinutes(dureeDeVieMinutes);
    }

    @Override
    public String genererAccessToken(Utilisateur utilisateur) {
        Instant maintenant = Instant.now();
        var builder = Jwts.builder()
                .subject(utilisateur.getId().toString())
                .claim(CLAIM_EMAIL, utilisateur.getEmail())
                .claim(CLAIM_ROLE, utilisateur.getRole().name())
                .issuedAt(Date.from(maintenant))
                .expiration(Date.from(maintenant.plus(dureeDeVie)));

        if (utilisateur.getCentreId() != null) {
            builder.claim(CLAIM_CENTRE_ID, utilisateur.getCentreId().toString());
        }
        if (utilisateur.getDepartementId() != null) {
            builder.claim(CLAIM_DEPARTEMENT_ID, utilisateur.getDepartementId().toString());
        }

        return builder.signWith(cle).compact();
    }

    @Override
    public ClaimsAccessToken validerAccessToken(String token) {
        try {
            Claims claims = Jwts.parser().verifyWith(cle).build()
                    .parseSignedClaims(token)
                    .getPayload();

            return new ClaimsAccessToken(
                    UUID.fromString(claims.getSubject()),
                    claims.get(CLAIM_EMAIL, String.class),
                    RoleUtilisateur.valueOf(claims.get(CLAIM_ROLE, String.class)),
                    lireUuid(claims, CLAIM_CENTRE_ID),
                    lireUuid(claims, CLAIM_DEPARTEMENT_ID));
        } catch (JwtException | IllegalArgumentException e) {
            throw new TokenInvalideException(e);
        }
    }

    private static UUID lireUuid(Claims claims, String nomClaim) {
        String valeur = claims.get(nomClaim, String.class);
        return valeur == null ? null : UUID.fromString(valeur);
    }
}
