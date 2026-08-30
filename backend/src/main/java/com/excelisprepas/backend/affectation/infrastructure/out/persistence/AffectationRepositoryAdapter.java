package com.excelisprepas.backend.affectation.infrastructure.out.persistence;

import com.excelisprepas.backend.affectation.domain.model.Affectation;
import com.excelisprepas.backend.affectation.domain.model.Jour;
import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class AffectationRepositoryAdapter implements AffectationRepositoryPort {

    private final AffectationJpaRepository jpaRepository;
    private final AffectationPersistenceMapper mapper;

    public AffectationRepositoryAdapter(AffectationJpaRepository jpaRepository, AffectationPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Affectation save(Affectation affectation) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(affectation)));
    }

    @Override
    public Optional<Affectation> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsBySalleIdAndJourAndSemaineAndSeance(UUID salleId, Jour jour, int semaine, int seance) {
        return jpaRepository.existsBySalleIdAndJourAndSemaineAndSeance(salleId, jour, semaine, seance);
    }

    @Override
    public boolean existsByCentreId(UUID centreId) {
        return jpaRepository.existsByCentreId(centreId);
    }

    @Override
    public boolean existsByEnseignantId(UUID enseignantId) {
        return jpaRepository.existsByEnseignantId(enseignantId);
    }

    @Override
    public boolean existsByFormationId(UUID formationId) {
        return jpaRepository.existsByFormationId(formationId);
    }

    @Override
    public boolean existsByMatiereId(UUID matiereId) {
        return jpaRepository.existsByMatiereId(matiereId);
    }

    @Override
    public boolean existsBySalleId(UUID salleId) {
        return jpaRepository.existsBySalleId(salleId);
    }

    @Override
    public List<Affectation> findBySessionIdAndCentreIdAndSemaine(UUID sessionId, UUID centreId, int semaine) {
        return jpaRepository.findBySessionIdAndCentreIdAndSemaine(sessionId, centreId, semaine).stream()
                .map(mapper::toDomain).toList();
    }

    @Override
    public List<Affectation> findBySessionIdAndSemaine(UUID sessionId, int semaine) {
        return jpaRepository.findBySessionIdAndSemaine(sessionId, semaine).stream()
                .map(mapper::toDomain).toList();
    }

    @Override
    public List<Affectation> findBySessionIdAndMatiereIdAndSemaine(UUID sessionId, UUID matiereId, int semaine) {
        return jpaRepository.findBySessionIdAndMatiereIdAndSemaine(sessionId, matiereId, semaine).stream()
                .map(mapper::toDomain).toList();
    }

    @Override
    public List<Affectation> findBySessionIdAndMatiereIdAndCentreIdAndSemaine(UUID sessionId, UUID matiereId, UUID centreId, int semaine) {
        return jpaRepository.findBySessionIdAndMatiereIdAndCentreIdAndSemaine(sessionId, matiereId, centreId, semaine).stream()
                .map(mapper::toDomain).toList();
    }

    @Override
    public List<Affectation> findByEnseignantIdAndSessionId(UUID enseignantId, UUID sessionId) {
        return jpaRepository.findByEnseignantIdAndSessionId(enseignantId, sessionId).stream()
                .map(mapper::toDomain).toList();
    }
}