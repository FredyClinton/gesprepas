package com.excelisprepas.backend.auth.domain.service;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Slf4j
public class AuthentificationService implements SeConnecterUseCase {

    private final UtilisateurRepositoryPort utilisateurRepository;
    private final PasswordEncoderPort passwordEncoder;

    public AuthentificationService(UtilisateurRepositoryPort utilisateurRepository,
                                   PasswordEncoderPort passwordEncoder) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
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

        String token = UUID.randomUUID().toString();
        log.info("Utilisateur connecté : id={}, email={}", utilisateur.getId(), email);
        return new ResultatConnexion(token, utilisateur);
    }
}
