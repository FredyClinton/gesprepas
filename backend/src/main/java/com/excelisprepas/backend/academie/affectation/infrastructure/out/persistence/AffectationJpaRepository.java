package com.excelisprepas.backend.academie.affectation.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.affectation.domain.model.Jour;
import com.excelisprepas.backend.academie.affectation.domain.model.StatutAffectation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AffectationJpaRepository extends JpaRepository<AffectationEntity, UUID> {
    boolean existsBySalleIdAndJourAndSemaineAndSeance(UUID salleId, Jour jour, int semaine, int seance);

    boolean existsByCentreId(UUID centreId);

    boolean existsByEnseignantId(UUID enseignantId);

    boolean existsByFormationId(UUID formationId);

    boolean existsByMatiereId(UUID matiereId);

    boolean existsBySalleId(UUID salleId);

    List<AffectationEntity> findBySessionIdAndCentreIdAndSemaine(UUID sessionId, UUID centreId, int semaine);

    List<AffectationEntity> findBySessionIdAndSemaine(UUID sessionId, int semaine);

    List<AffectationEntity> findBySessionIdAndMatiereIdAndSemaine(UUID sessionId, UUID matiereId, int semaine);

    List<AffectationEntity> findBySessionIdAndMatiereIdAndCentreIdAndSemaine(UUID sessionId, UUID matiereId, UUID centreId, int semaine);

    List<AffectationEntity> findByEnseignantIdAndSessionId(UUID enseignantId, UUID sessionId);

    List<AffectationEntity> findByEnseignantIdAndStatut(UUID enseignantId, StatutAffectation statut);

    List<AffectationEntity> findByEnseignantId(UUID enseignantId);
    List<AffectationEntity> findBySessionIdAndStatutAndStatutPaiement(UUID sessionId, StatutAffectation statut, com.excelisprepas.backend.academie.affectation.domain.model.StatutPaiement statutPaiement);
    List<AffectationEntity> findByEnseignantIdAndSessionIdAndStatutAndStatutPaiement(UUID enseignantId, UUID sessionId, StatutAffectation statut, com.excelisprepas.backend.academie.affectation.domain.model.StatutPaiement statutPaiement);
}
