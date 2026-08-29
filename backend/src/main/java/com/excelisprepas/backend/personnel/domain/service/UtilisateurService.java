package com.excelisprepas.backend.personnel.domain.service;

import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;
import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.shared.exception.CentreIntrouvableException;
import com.excelisprepas.backend.shared.exception.DepartementIntrouvableException;
import com.excelisprepas.backend.shared.exception.EmailDejaUtiliseException;
import com.excelisprepas.backend.shared.exception.UtilisateurIntrouvableException;

import java.util.List;
import java.util.UUID;

public class UtilisateurService implements CreerUtilisateurUseCase, RecupererUtilisateurUseCase,
        ListerUtilisateursUseCase, ChangerEmailUseCase, ChangerMotDePasseUseCase,
        RattacherCentreUseCase, DetacherCentreUseCase, RattacherDepartementUseCase,
        DetacherDepartementUseCase, SupprimerUtilisateurUseCase {

    private final UtilisateurRepositoryPort repository;
    private final PasswordEncoderPort passwordEncoder;
    private final CentreRepositoryPort centreRepository;
    private final DepartementRepositoryPort departementRepository;

    public UtilisateurService(UtilisateurRepositoryPort repository, PasswordEncoderPort passwordEncoder,
                              CentreRepositoryPort centreRepository, DepartementRepositoryPort departementRepository) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.centreRepository = centreRepository;
        this.departementRepository = departementRepository;
    }

    @Override
    public Utilisateur creerUtilisateur(String nom, String prenom, String email,
                                        String password, RoleUtilisateur role) {
        if (repository.existsByEmail(email)) {
            throw new EmailDejaUtiliseException(email);
        }

        String motDePasseHash = passwordEncoder.encoder(password);
        Utilisateur utilisateur = new Utilisateur(UUID.randomUUID(), nom, prenom, email, motDePasseHash, role);
        return repository.save(utilisateur);
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
            throw new EmailDejaUtiliseException(nouvelEmail);
        }
        utilisateur.changerEmail(nouvelEmail);
        return repository.save(utilisateur);
    }

    @Override
    public void changerMotDePasse(UUID id, String nouveauPassword) {
        Utilisateur utilisateur = recupererUtilisateur(id);
        utilisateur.changerMotDePasseHash(passwordEncoder.encoder(nouveauPassword));
        repository.save(utilisateur);
    }

    @Override
    public Utilisateur rattacherCentre(UUID id, UUID centreId) {
        Utilisateur utilisateur = recupererUtilisateur(id);
        if (centreRepository.findById(centreId).isEmpty()) {
            throw new CentreIntrouvableException(centreId);
        }
        utilisateur.rattacherACentre(centreId);
        return repository.save(utilisateur);
    }

    @Override
    public Utilisateur detacherCentre(UUID id) {
        Utilisateur utilisateur = recupererUtilisateur(id);
        utilisateur.detacherDuCentre();
        return repository.save(utilisateur);
    }

    @Override
    public Utilisateur rattacherDepartement(UUID id, UUID departementId) {
        Utilisateur utilisateur = recupererUtilisateur(id);
        if (departementRepository.findById(departementId).isEmpty()) {
            throw new DepartementIntrouvableException(departementId);
        }
        utilisateur.rattacherADepartement(departementId);
        return repository.save(utilisateur);
    }

    @Override
    public Utilisateur detacherDepartement(UUID id) {
        Utilisateur utilisateur = recupererUtilisateur(id);
        utilisateur.detacherDuDepartement();
        return repository.save(utilisateur);
    }

    @Override
    public void supprimerUtilisateur(UUID id) {
        recupererUtilisateur(id); // vérifie l'existence
        repository.deleteById(id);
    }
}