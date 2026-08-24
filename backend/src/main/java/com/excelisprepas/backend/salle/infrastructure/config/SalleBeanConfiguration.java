package com.excelisprepas.backend.salle.infrastructure.config;

import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.in.CreerSalleUseCase;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.salle.domain.service.SalleService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SalleBeanConfiguration {

    @Bean
    public CreerSalleUseCase creerSalleUseCase(SalleRepositoryPort salleRepository,
                                               CentreRepositoryPort centreRepository,
                                               FormationRepositoryPort formationRepository) {
        return new SalleService(salleRepository, centreRepository, formationRepository);
    }
}