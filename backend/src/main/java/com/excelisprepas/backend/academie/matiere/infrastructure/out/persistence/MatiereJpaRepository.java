package com.excelisprepas.backend.academie.matiere.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface MatiereJpaRepository extends JpaRepository<MatiereEntity, UUID> {
    Optional<MatiereEntity> findByNomIgnoreCase(String nom);

    // Tables ayant une clé étrangère vers matieres (voir V13 et V23).
    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM epreuves_concours_blanc WHERE matiere_id = :id)
                OR EXISTS (SELECT 1 FROM quotas_hebdomadaires WHERE matiere_id = :id)
            """, nativeQuery = true)
    boolean estReferencee(UUID id);
}