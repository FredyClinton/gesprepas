package com.excelisprepas.backend.personnel.domain.port.out;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UtilisateurRepositoryPort {

    Utilisateur save(Utilisateur utilisateur);

    Optional<Utilisateur> findById(UUID id);

    Optional<Utilisateur> findByEmail(String email);

    boolean existsByEmail(String email);

    List<Utilisateur> findAll();

    void deleteById(UUID id);

    boolean existsByCentreId(UUID centreId);
}