package com.excelisprepas.backend.auth.domain.service;

import com.excelisprepas.backend.auth.domain.model.ResultatConnexion;
import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.model.AttributionRole;
import com.excelisprepas.backend.rattachement.domain.port.in.ListerRolesUseCase;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.shared.exception.AuthentificationEchoueeException;

import java.util.List;
import java.util.UUID;

public class AuthentificationService implements SeConnecterUseCase {

    private final UtilisateurRepositoryPort utilisateurRepository;
    private final PasswordEncoderPort passwordEncoder;
    private final SessionAcademiqueRepositoryPort sessionRepository;
    private final ListerRolesUseCase listerRolesUseCase;

    public AuthentificationService(UtilisateurRepositoryPort utilisateurRepository,
                                   PasswordEncoderPort passwordEncoder,
                                   SessionAcademiqueRepositoryPort sessionRepository,
                                   ListerRolesUseCase listerRolesUseCase) {
        this.utilisateurRepository = utilisateurRepository;
        this.passwordEncoder = passwordEncoder;
        this.sessionRepository = sessionRepository;
        this.listerRolesUseCase = listerRolesUseCase;
    }

    @Override
    public ResultatConnexion seConnecter(String email, String password) {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
                .orElseThrow(AuthentificationEchoueeException::new);

        if (!passwordEncoder.correspond(password, utilisateur.getMotDePasseHash())) {
            throw new AuthentificationEchoueeException();
        }

        List<RoleUtilisateur> roles = sessionRepository.findEnCours()
                .map(session -> listerRolesUseCase.listerParUtilisateurEtSession(utilisateur.getId(), session.getId())
                        .stream()
                        .map(AttributionRole::getRole)
                        .toList())
                .orElse(List.of());

        String token = UUID.randomUUID().toString();
        return new ResultatConnexion(token, utilisateur, roles);
    }
}
