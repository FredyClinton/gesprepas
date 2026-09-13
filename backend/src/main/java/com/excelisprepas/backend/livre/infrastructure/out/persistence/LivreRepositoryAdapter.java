package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import com.excelisprepas.backend.livre.domain.model.Livre;
import com.excelisprepas.backend.livre.domain.port.out.LivreRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class LivreRepositoryAdapter implements LivreRepositoryPort {

    private final JpaLivreRepository jpaLivreRepository;
    private final LivrePersistenceMapper mapper;

    public LivreRepositoryAdapter(JpaLivreRepository jpaLivreRepository, LivrePersistenceMapper mapper) {
        this.jpaLivreRepository = jpaLivreRepository;
        this.mapper = mapper;
    }

    @Override
    public Livre save(Livre livre) {
        LivreEntity entity = mapper.toEntity(livre);
        LivreEntity saved = jpaLivreRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Livre> findById(UUID id) {
        return jpaLivreRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<Livre> findByTitre(String titre) {
        return jpaLivreRepository.findByTitreIgnoreCase(titre).map(mapper::toDomain);
    }

    @Override
    public List<Livre> findAll() {
        return jpaLivreRepository.findAllByOrderByTitreAsc().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<Livre> findByActifTrue() {
        return jpaLivreRepository.findByActifTrueOrderByTitreAsc().stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(UUID id) {
        jpaLivreRepository.deleteById(id);
    }
}

