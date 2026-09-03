package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.EmailDejaUtiliseException;
import com.excelisprepas.backend.shared.exception.UtilisateurIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@Slf4j
public class UtilisateurService implements CreerUtilisateurUseCase, RecupererUtilisateurUseCase,
        ListerUtilisateursUseCase, ChangerEmailUseCase, ChangerMotDePasseUseCase,
        RattacherCentreUseCase, DetacherCentreUseCase, SupprimerUtilisateurUseCase {

    private final UtilisateurRepositoryPort repository;
    private final PasswordEncoderPort passwordEncoder;
    private final CentreRepositoryPort centreRepository;

    public UtilisateurService(UtilisateurRepositoryPort repository, PasswordEncoderPort passwordEncoder,
                              CentreRepositoryPort centreRepository) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.centreRepository = centreRepository;
    }

    @Override
    public Utilisateur creerUtilisateur(String nom, String prenom, String email,
                                        String password, RoleUtilisateur role) {
        if (repository.existsByEmail(email)) {
            log.warn("Création d'utilisateur refusée : email {} déjà utilisé", email);
            throw new EmailDejaUtiliseException(email);
        }

        String motDePasseHash = passwordEncoder.encoder(password);
        Utilisateur utilisateur = new Utilisateur(UUID.randomUUID(), nom, prenom, email, motDePasseHash, role);
        utilisateur = repository.save(utilisateur);
        log.info("Utilisateur créé : id={}, email={}, role={}", utilisateur.getId(), email, role);
        return utilisateur;
    }

    @Override
    public Utilisateur recupererUtilisateur(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new UtilisateurIntrouvableException(id));
    }

    @Override
    public List<Utilisateur> listerUtilisateurs() {
        return repository.findAll();
    }

    @Override
    public Utilisateur changerEmail(UUID id, String nouvelEmail) {
        Utilisateur utilisateur = recupererUtilisateur(id);
        if (!nouvelEmail.equalsIgnoreCase(utilisateur.getEmail()) && repository.existsByEmail(nouvelEmail)) {
            log.warn("Changement d'email refusé : email {} déjà utilisé", nouvelEmail);
            throw new EmailDejaUtiliseException(nouvelEmail);
        }
        utilisateur.changerEmail(nouvelEmail);
        utilisateur = repository.save(utilisateur);
        log.info("Email d'utilisateur modifié : id={}, nouvelEmail={}", id, nouvelEmail);
        return utilisateur;
    }

    @Override
    public void changerMotDePasse(UUID id, String nouveauPassword) {
        Utilisateur utilisateur = recupererUtilisateur(id);
        utilisateur.changerMotDePasseHash(passwordEncoder.encoder(nouveauPassword));
        repository.save(utilisateur);
        log.info("Mot de passe d'utilisateur modifié : id={}", id);
    }

    @Override
    public Utilisateur rattacherCentre(UUID id, UUID centreId) {
        Utilisateur utilisateur = recupererUtilisateur(id);
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        utilisateur.rattacherACentre(centreId);
        utilisateur = repository.save(utilisateur);
        log.info("Utilisateur rattaché à un centre : id={}, centreId={}", id, centreId);
        return utilisateur;
    }

    @Override
    public Utilisateur detacherCentre(UUID id) {
        Utilisateur utilisateur = recupererUtilisateur(id);
        utilisateur.detacherDuCentre();
        utilisateur = repository.save(utilisateur);
        log.info("Utilisateur détaché du centre : id={}", id);
        return utilisateur;
    }

    @Override
    public void supprimerUtilisateur(UUID id) {
        recupererUtilisateur(id); // vérifie l'existence
        repository.deleteById(id);
        log.info("Utilisateur supprimé : id={}", id);
    }
}
