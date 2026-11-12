package com.excelisprepas.backend.auth.infrastructure.out.persistence;

import com.excelisprepas.backend.auth.domain.model.RefreshToken;
import com.excelisprepas.backend.auth.domain.port.out.RefreshTokenRepositoryPort;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Component
public class RefreshTokenRepositoryAdapter implements RefreshTokenRepositoryPort {

    private final RefreshTokenJpaRepository jpaRepository;
    private final RefreshTokenPersistenceMapper mapper;

    public RefreshTokenRepositoryAdapter(RefreshTokenJpaRepository jpaRepository,
                                         RefreshTokenPersistenceMapper mapper) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public RefreshToken save(RefreshToken refreshToken) {
        return mapper.toDomain(jpaRepository.save(mapper.toEntity(refreshToken)));
    }

    @Override
    public Optional<RefreshToken> findByTokenHash(String tokenHash) {
        return jpaRepository.findByTokenHash(tokenHash).map(mapper::toDomain);
    }

    @Override
    public void revoquerTousPourUtilisateur(UUID utilisateurId, Instant dateRevocation) {
        jpaRepository.revoquerTousPourUtilisateur(utilisateurId, dateRevocation);
    }
}
