package com.excelisprepas.backend.departement.infrastructure.config;

import com.excelisprepas.backend.departement.domain.port.in.*;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.departement.domain.service.DepartementService;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DepartementBeanConfiguration {

    @Bean
    public DepartementService departementService(DepartementRepositoryPort departementRepository,
                                                 MatiereRepositoryPort matiereRepository) {
        return new DepartementService(departementRepository, matiereRepository);
    }

    @Bean
    public CreerDepartementUseCase creerDepartementUseCase(DepartementService departementService) {
        return departementService;
    }

    @Bean
    public RecupererDepartementUseCase recupererDepartementUseCase(DepartementService departementService) {
        return departementService;
    }

    @Bean
    public ListerDepartementsUseCase listerDepartementsUseCase(DepartementService departementService) {
        return departementService;
    }

    @Bean
    public RenommerDepartementUseCase renommerDepartementUseCase(DepartementService departementService) {
        return departementService;
    }

    @Bean
    public SupprimerDepartementUseCase supprimerDepartementUseCase(DepartementService departementService) {
        return departementService;
    }
}