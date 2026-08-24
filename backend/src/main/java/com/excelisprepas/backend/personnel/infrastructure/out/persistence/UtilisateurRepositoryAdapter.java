package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import com.excelisprepas.backend.personnel.domain.model.Utilisateur;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class UtilisateurRepositoryAdapter implements UtilisateurRepositoryPort {

    private final UtilisateurJpaRepository jpaRepository;
    private final UtilisateurPersistenceMapper mapper;

    public UtilisateurRepositoryAdapter(UtilisateurJpaRepository jpaRepository,
                                        UtilisateurPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Utilisateur save(Utilisateur utilisateur) {
        UtilisateurEntity entite = mapper.toEntity(utilisateur);
        UtilisateurEntity sauvegarde = jpaRepository.save(entite);
        return mapper.toDomain(sauvegarde);
    }

    @Override
    public Optional<Utilisateur> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<Utilisateur> findByEmail(String email) {
        return jpaRepository.findByEmail(email).map(mapper::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public List<Utilisateur> findAll() {
        return jpaRepository.findAll().stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsByCentreId(UUID centreId) {
        return jpaRepository.existsByCentreId(centreId);
    }
}