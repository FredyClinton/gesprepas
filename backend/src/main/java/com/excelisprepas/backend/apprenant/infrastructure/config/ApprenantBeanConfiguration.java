package com.excelisprepas.backend.apprenant.infrastructure.config;

import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.service.ApprenantService;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApprenantBeanConfiguration {

    @Bean
    public ApprenantService apprenantService(ApprenantRepositoryPort apprenantRepository,
                                             CentreRepositoryPort centreRepository) {
        return new ApprenantService(apprenantRepository, centreRepository);
    }

    @Bean
    public CreerApprenantUseCase creerApprenantUseCase(ApprenantService apprenantService) {
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
    public SupprimerApprenantUseCase supprimerApprenantUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }
}