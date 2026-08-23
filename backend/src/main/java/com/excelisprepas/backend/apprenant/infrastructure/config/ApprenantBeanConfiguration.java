package com.excelisprepas.backend.apprenant.infrastructure.config;

import com.excelisprepas.backend.apprenant.domain.port.in.InscrireApprenantUseCase;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.service.ApprenantService;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApprenantBeanConfiguration {

    @Bean
    public InscrireApprenantUseCase inscrireApprenantUseCase(ApprenantRepositoryPort apprenantRepository,
                                                             CentreRepositoryPort centreRepository,
                                                             FormationRepositoryPort formationRepository) {
        return new ApprenantService(apprenantRepository, centreRepository, formationRepository);
    }
}