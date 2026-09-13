package com.excelisprepas.backend.academie.etablissement.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EtablissementJpaRepository extends JpaRepository<EtablissementEntity, UUID> {

    Optional<EtablissementEntity> findByNomIgnoreCase(String nom);

    List<EtablissementEntity> findAllByOrderByNomAsc();
}

