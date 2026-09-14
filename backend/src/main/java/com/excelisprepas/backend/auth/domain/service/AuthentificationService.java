package com.excelisprepas.backend.auth.domain.service;

import com.excelisprepas.backend.auth.domain.model.RefreshToken;
import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.auth.domain.port.in.RafraichirTokenUseCase;
import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.auth.domain.port.in.SeDeconnecterUseCase;
import com.excelisprepas.backend.auth.domain.port.out.RefreshTokenRepositoryPort;
import com.excelisprepas.backend.auth.domain.port.out.TokenPort;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;
import com.excelisprepas.backend.shared.exception.TokenInvalideException;
import lombok.extern.slf4j.Slf4j;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Slf4j
public class AuthentificationService implements SeConnecterUseCase, RafraichirTokenUseCase, SeDeconnecterUseCase {

    private static final int TAILLE_REFRESH_TOKEN_OCTETS = 32; // 256 bits d'entropie

    private final UtilisateurRepositoryPort utilisateurRepository;
    private final PasswordEncoderPort passwordEncoder;
    private final TokenPort tokenPort;
    private final RefreshTokenRepositoryPort refreshTokenRepository;
    private final Duration dureeDeVieRefreshToken;
    private final SecureRandom random = new SecureRandom();

    public AuthentificationService(UtilisateurRepositoryPort utilisateurRepository,
                                   PasswordEncoderPort passwordEncoder,
                                   TokenPort tokenPort,
                                   RefreshTokenRepositoryPort refreshTokenRepository,
                                   Duration dureeDeVieRefreshToken) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenPort = tokenPort;
        this.refreshTokenRepository = refreshTokenRepository;
        this.dureeDeVieRefreshToken = dureeDeVieRefreshToken;
    }

    @Override
    public ResultatConnexion seConnecter(String email, String password) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(() -> {
                    log.warn("Connexion refusée : aucun utilisateur pour l'email {}", email);
                    return new AuthentificationEchoueeException();
                });

        if (!passwordEncoder.correspond(password, utilisateur.getMotDePasseHash())) {
            log.warn("Connexion refusée : mot de passe incorrect pour l'utilisateur {}", utilisateur.getId());
            throw new AuthentificationEchoueeException();
        }

        log.info("Utilisateur connecté : id={}, email={}", utilisateur.getId(), email);
        return genererResultatConnexion(utilisateur);
    }

    @Override
    public ResultatConnexion rafraichir(String refreshTokenEnClair) {
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hacher(refreshTokenEnClair))
                .orElseThrow(() -> {
                    log.warn("Rafraîchissement refusé : refresh token inconnu");
                    return new TokenInvalideException();
                });

        if (!refreshToken.estValide(Instant.now())) {
            log.warn("Rafraîchissement refusé : refresh token expiré ou révoqué (id={})", refreshToken.getId());
            throw new TokenInvalideException();
        }

        // Rotation : l'ancien refresh token est révoqué dès qu'il sert, un
        // vol de refresh token ne permet donc de rafraîchir qu'une fois.
        refreshToken.revoquer();
        refreshTokenRepository.save(refreshToken);

        Utilisateur utilisateur = utilisateurRepository.findById(refreshToken.getUtilisateurId())
                .orElseThrow(() -> {
                    log.warn("Rafraîchissement refusé : utilisateur {} introuvable", refreshToken.getUtilisateurId());
                    return new TokenInvalideException();
                });

        log.info("Token rafraîchi : utilisateurId={}", utilisateur.getId());
        return genererResultatConnexion(utilisateur);
    }

    @Override
    public void seDeconnecter(String refreshTokenEnClair) {
        refreshTokenRepository.findByTokenHash(hacher(refreshTokenEnClair)).ifPresent(refreshToken -> {
            refreshToken.revoquer();
            refreshTokenRepository.save(refreshToken);
            log.info("Utilisateur déconnecté : utilisateurId={}", refreshToken.getUtilisateurId());
        });
        // Refresh token inconnu ou déjà révoqué : on ne révèle rien, la
        // déconnexion est déjà effective dans tous les cas du point de vue
        // de l'appelant.
    }

    private ResultatConnexion genererResultatConnexion(Utilisateur utilisateur) {
        String accessToken = tokenPort.genererAccessToken(utilisateur);
        String refreshTokenEnClair = genererValeurAleatoire();

        RefreshToken refreshToken = RefreshToken.creer(
                utilisateur.getId(), hacher(refreshTokenEnClair), Instant.now().plus(dureeDeVieRefreshToken));
        refreshTokenRepository.save(refreshToken);

        return new ResultatConnexion(accessToken, refreshTokenEnClair, utilisateur);
    }

    private String genererValeurAleatoire() {
        byte[] octets = new byte[TAILLE_REFRESH_TOKEN_OCTETS];
        random.nextBytes(octets);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(octets);
    }

    private static String hacher(String valeur) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(valeur.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponible sur cette JVM", e);
        }
    }
}
