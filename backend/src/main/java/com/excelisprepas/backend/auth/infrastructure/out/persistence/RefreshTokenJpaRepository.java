package com.excelisprepas.backend.auth.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;

import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenJpaRepository extends JpaRepository<RefreshTokenEntity, UUID> {
    Optional<RefreshTokenEntity> findByTokenHash(String tokenHash);

    @Modifying
    @Query("update RefreshTokenEntity r set r.dateRevocation = :date "
            + "where r.utilisateurId = :utilisateurId and r.dateRevocation is null")
    int revoquerTousPourUtilisateur(@Param("utilisateurId") UUID utilisateurId, @Param("date") Instant date);
}
