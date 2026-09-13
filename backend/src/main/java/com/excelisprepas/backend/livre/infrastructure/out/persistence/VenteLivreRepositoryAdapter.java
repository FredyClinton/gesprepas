package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import com.excelisprepas.backend.livre.domain.model.VenteLivre;
import com.excelisprepas.backend.livre.domain.port.out.VenteLivreRepositoryPort;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class VenteLivreRepositoryAdapter implements VenteLivreRepositoryPort {

    private final JpaVenteLivreRepository jpaVenteLivreRepository;
    private final VenteLivrePersistenceMapper mapper;

    public VenteLivreRepositoryAdapter(JpaVenteLivreRepository jpaVenteLivreRepository, VenteLivrePersistenceMapper mapper) {
        this.jpaVenteLivreRepository = jpaVenteLivreRepository;
        this.mapper = mapper;
    }

    @Override
    public VenteLivre save(VenteLivre vente) {
        VenteLivreEntity entity = mapper.toEntity(vente);
        VenteLivreEntity saved = jpaVenteLivreRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public List<VenteLivre> saveAll(List<VenteLivre> ventes) {
        List<VenteLivreEntity> entities = ventes.stream()
                .map(mapper::toEntity)
                .collect(Collectors.toList());
        return jpaVenteLivreRepository.saveAll(entities).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<VenteLivre> findById(UUID id) {
        return jpaVenteLivreRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<VenteLivre> findBySessionId(UUID sessionId) {
        return jpaVenteLivreRepository.findBySessionIdOrderByDateVenteDescCreatedAtDesc(sessionId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<VenteLivre> findWithFilters(UUID sessionId, UUID centreId, UUID livreId, LocalDate dateDebut, LocalDate dateFin) {
        return jpaVenteLivreRepository.findWithFilters(sessionId, centreId, livreId, dateDebut, dateFin).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<VenteLivre> findByEntreeId(UUID entreeId) {
        return jpaVenteLivreRepository.findByEntreeId(entreeId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteAll(List<VenteLivre> ventes) {
        List<VenteLivreEntity> entities = ventes.stream()
                .map(mapper::toEntity)
                .collect(Collectors.toList());
        jpaVenteLivreRepository.deleteAll(entities);
    }
}

