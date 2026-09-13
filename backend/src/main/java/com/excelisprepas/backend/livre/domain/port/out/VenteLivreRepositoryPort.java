package com.excelisprepas.backend.livre.domain.port.out;

import com.excelisprepas.backend.livre.domain.model.VenteLivre;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface VenteLivreRepositoryPort {
    VenteLivre save(VenteLivre vente);
    List<VenteLivre> saveAll(List<VenteLivre> ventes);
    Optional<VenteLivre> findById(UUID id);
    List<VenteLivre> findBySessionId(UUID sessionId);
    List<VenteLivre> findWithFilters(UUID sessionId, UUID centreId, UUID livreId, LocalDate dateDebut, LocalDate dateFin);
}

