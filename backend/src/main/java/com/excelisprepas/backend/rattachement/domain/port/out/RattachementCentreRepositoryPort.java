package com.excelisprepas.backend.rattachement.domain.port.out;

import com.excelisprepas.backend.rattachement.domain.model.RattachementCentre;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RattachementCentreRepositoryPort {
    RattachementCentre save(RattachementCentre rattachement);

    Optional<RattachementCentre> findById(UUID id);

    boolean existsByUtilisateurIdAndSessionId(UUID utilisateurId, UUID sessionId);

    List<RattachementCentre> findByCentreIdAndSessionId(UUID centreId, UUID sessionId);

    boolean existsByCentreId(UUID centreId);

    void deleteById(UUID id);
}