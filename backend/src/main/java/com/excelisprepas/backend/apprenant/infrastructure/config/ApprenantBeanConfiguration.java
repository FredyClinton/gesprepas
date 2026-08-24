package com.excelisprepas.backend.apprenant.infrastructure.config;

import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.service.ApprenantService;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApprenantBeanConfiguration {

    @Bean
    public ApprenantService apprenantService(ApprenantRepositoryPort apprenantRepository,
                                             CentreRepositoryPort centreRepository,
                                             FormationRepositoryPort formationRepository) {
        return new ApprenantService(apprenantRepository, centreRepository, formationRepository);
    }

    @Bean
    public InscrireApprenantUseCase inscrireApprenantUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public RecupererApprenantUseCase recupererApprenantUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public ListerApprenantsUseCase listerApprenantsUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public TransfererCentreUseCase transfererCentreUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public TransfererFormationUseCase transfererFormationUseCase(ApprenantService service) {
        return service;
    }

    @Bean
    public RenegocierContratUseCase renegocierContratUseCase(ApprenantService service) {
        return service;
    }

    @Bean
    public SupprimerApprenantUseCase supprimerApprenantUseCase(ApprenantService service) {
        return service;
    }
}