package com.excelisprepas.backend.livre.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public interface JpaVenteLivreRepository extends JpaRepository<VenteLivreEntity, UUID> {

    List<VenteLivreEntity> findBySessionIdOrderByDateVenteDescCreatedAtDesc(UUID sessionId);

    List<VenteLivreEntity> findBySessionIdAndCentreIdOrderByDateVenteDescCreatedAtDesc(UUID sessionId, UUID centreId);

    @Query("SELECT v FROM VenteLivreEntity v WHERE v.sessionId = :sessionId " +
           "AND (:centreId IS NULL OR v.centreId = :centreId) " +
           "AND (:livreId IS NULL OR v.livreId = :livreId) " +
           "AND (cast(:dateDebut as date) IS NULL OR v.dateVente >= :dateDebut) " +
           "AND (cast(:dateFin as date) IS NULL OR v.dateVente <= :dateFin) " +
           "ORDER BY v.dateVente DESC, v.createdAt DESC")
    List<VenteLivreEntity> findWithFilters(
            @Param("sessionId") UUID sessionId,
            @Param("centreId") UUID centreId,
            @Param("livreId") UUID livreId,
            @Param("dateDebut") LocalDate dateDebut,
            @Param("dateFin") LocalDate dateFin
    );

    List<VenteLivreEntity> findByEntreeId(UUID entreeId);
}

