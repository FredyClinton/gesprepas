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
    public CreerSessionAcademiqueUseCase creerSessionAcademiqueUseCase(SessionAcademiqueService service) {
        return service;
    }

    @Bean
    public RecupererSessionUseCase recupererSessionUseCase(SessionAcademiqueService service) {
        return service;
    }

    @Bean
    public ListerSessionsUseCase listerSessionsUseCase(SessionAcademiqueService service) {
        return service;
    }

    @Bean
    public DemarrerSessionUseCase demarrerSessionUseCase(SessionAcademiqueService service) {
        return service;
    }

    @Bean
    public CloturerSessionUseCase cloturerSessionUseCase(SessionAcademiqueService service) {
        return service;
    }

    @Bean
    public SupprimerSessionUseCase supprimerSessionUseCase(SessionAcademiqueService service) {
        return service;
    }
}