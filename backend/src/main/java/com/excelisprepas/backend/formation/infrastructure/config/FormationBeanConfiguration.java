package com.excelisprepas.backend.formation.infrastructure.config;

import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.in.CreerFormationUseCase;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.formation.domain.service.FormationService;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FormationBeanConfiguration {

    @Bean
    public CreerFormationUseCase creerFormationUseCase(FormationRepositoryPort repository,
                                                        CentreRepositoryPort centreRepository,
                                                        SessionAcademiqueRepositoryPort sessionRepository) {
        return new FormationService(repository, centreRepository, sessionRepository);
    }
}