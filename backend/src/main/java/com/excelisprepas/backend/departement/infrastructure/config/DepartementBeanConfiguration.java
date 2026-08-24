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
    public CreerDepartementUseCase creerDepartementUseCase(DepartementService service) {
        return service;
    }

    @Bean
    public RecupererDepartementUseCase recupererDepartementUseCase(DepartementService service) {
        return service;
    }

    @Bean
    public ListerDepartementsUseCase listerDepartementsUseCase(DepartementService service) {
        return service;
    }

    @Bean
    public RenommerDepartementUseCase renommerDepartementUseCase(DepartementService service) {
        return service;
    }

    @Bean
    public SupprimerDepartementUseCase supprimerDepartementUseCase(DepartementService service) {
        return service;
    }
}