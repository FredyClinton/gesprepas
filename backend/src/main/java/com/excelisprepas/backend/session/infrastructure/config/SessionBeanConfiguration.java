package com.excelisprepas.backend.session.infrastructure.config;

import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.session.domain.port.in.*;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.session.domain.service.SessionAcademiqueService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SessionBeanConfiguration {

    @Bean
    public SessionAcademiqueService sessionAcademiqueService(SessionAcademiqueRepositoryPort repository,
                                                             FormationRepositoryPort formationRepository) {
        return new SessionAcademiqueService(repository, formationRepository);
    }

    @Bean
    public CreerSessionAcademiqueUseCase creerSessionAcademiqueUseCase(SessionAcademiqueService sessionAcademiqueService) {
        return sessionAcademiqueService;
    }

    @Bean
    public RecupererSessionUseCase recupererSessionUseCase(SessionAcademiqueService sessionAcademiqueService) {
        return sessionAcademiqueService;
    }

    @Bean
    public ListerSessionsUseCase listerSessionsUseCase(SessionAcademiqueService sessionAcademiqueService) {
        return sessionAcademiqueService;
    }

    @Bean
    public DemarrerSessionUseCase demarrerSessionUseCase(SessionAcademiqueService sessionAcademiqueService) {
        return sessionAcademiqueService;
    }

    @Bean
    public CloturerSessionUseCase cloturerSessionUseCase(SessionAcademiqueService sessionAcademiqueService) {
        return sessionAcademiqueService;
    }

    @Bean
    public SupprimerSessionUseCase supprimerSessionUseCase(SessionAcademiqueService sessionAcademiqueService) {
        return sessionAcademiqueService;
    }
}