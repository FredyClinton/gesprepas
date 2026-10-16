package com.excelisprepas.backend.personnel.infrastructure.out.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UtilisateurJpaRepository extends JpaRepository<UtilisateurEntity, UUID> {
    Optional<UtilisateurEntity> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByCentreId(UUID centreId);

    Optional<UtilisateurEntity> findByDepartementId(UUID departementId);

    java.util.List<UtilisateurEntity> findByRole(com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur role);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "INSERT INTO utilisateurs (id, mot_de_passe_hash, role, centre_id) VALUES (:id, :motDePasseHash, :role, :centreId)", nativeQuery = true)
    void creerCompteExistant(@Param("id") UUID id, @Param("motDePasseHash") String motDePasseHash, @Param("role") String role, @Param("centreId") UUID centreId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "DELETE FROM utilisateurs WHERE id = :id", nativeQuery = true)
    void supprimerCompteSeul(@Param("id") UUID id);
}
