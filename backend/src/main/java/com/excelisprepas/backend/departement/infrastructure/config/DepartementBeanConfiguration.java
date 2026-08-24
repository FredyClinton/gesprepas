package com.excelisprepas.backend.departement.infrastructure.config;

import com.excelisprepas.backend.departement.domain.port.in.CreerDepartementUseCase;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.departement.domain.service.DepartementService;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DepartementBeanConfiguration {

    @Bean
    public CreerDepartementUseCase creerDepartementUseCase(DepartementRepositoryPort departementRepository,
                                                           MatiereRepositoryPort matiereRepository) {
        return new DepartementService(departementRepository, matiereRepository);
    }
}