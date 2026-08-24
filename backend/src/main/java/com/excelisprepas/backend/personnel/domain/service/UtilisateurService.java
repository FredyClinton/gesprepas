package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.CreerUtilisateurUseCase;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.EmailDejaUtiliseException;

import java.util.UUID;

public class UtilisateurService implements CreerUtilisateurUseCase {

    private final UtilisateurRepositoryPort repository;
    private final PasswordEncoderPort passwordEncoder;

    public UtilisateurService(UtilisateurRepositoryPort repository, PasswordEncoderPort passwordEncoder) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public Utilisateur creerUtilisateur(String nom, String prenom, String email,
                                        String motDePasseClair, RoleUtilisateur role) {
        if (repository.existsByEmail(email)) {
            throw new EmailDejaUtiliseException(email);
        }

        String motDePasseHash = passwordEncoder.encoder(motDePasseClair);
        Utilisateur utilisateur = new Utilisateur(UUID.randomUUID(), nom, prenom, email, motDePasseHash, role);
        return repository.save(utilisateur);
    }
}
