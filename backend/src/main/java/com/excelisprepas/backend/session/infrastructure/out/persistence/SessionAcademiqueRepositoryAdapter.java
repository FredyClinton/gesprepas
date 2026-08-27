package com.excelisprepas.backend.session.infrastructure.out.persistence;


import com.excelisprepas.backend.session.domain.model.SessionAcademique;
import com.excelisprepas.backend.session.domain.model.StatutSession;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Component
public class SessionAcademiqueRepositoryAdapter implements SessionAcademiqueRepositoryPort {

    private final SessionAcademiqueJpaRepository jpaRepository;
    private final SessionAcademiqueMapper mapper;

    public SessionAcademiqueRepositoryAdapter(SessionAcademiqueJpaRepository jpaRepository, SessionAcademiqueMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public SessionAcademique save(SessionAcademique session) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(session)));
    }

    @Override
    public Optional<SessionAcademique> findById(UUID id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public List<SessionAcademique> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).toList();
    }

    @Override
    public void deleteById(UUID id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public Optional<SessionAcademique> findEnCours() {
        return jpaRepository.findByStatut(StatutSession.EN_COURS).map(mapper::toDomain);
    }
}
