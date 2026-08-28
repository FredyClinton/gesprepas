package com.excelisprepas.backend.auth.domain.service;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;

import java.util.UUID;

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
                .orElseThrow(AuthentificationEchoueeException::new);

        if (!passwordEncoder.correspond(password, utilisateur.getMotDePasseHash())) {
            throw new AuthentificationEchoueeException();
        }

        String token = UUID.randomUUID().toString();
        return new ResultatConnexion(token, utilisateur);
    }
}
