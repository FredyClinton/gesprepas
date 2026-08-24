package com.excelisprepas.backend.salle.infrastructure.config;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.in.*;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.salle.domain.service.SalleService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SalleBeanConfiguration {

    @Bean
    public SalleService salleService(SalleRepositoryPort salleRepository,
                                     CentreRepositoryPort centreRepository,
                                     FormationRepositoryPort formationRepository,
                                     AffectationRepositoryPort affectationRepository) {
        return new SalleService(salleRepository, centreRepository, formationRepository, affectationRepository);
    }

    @Bean
    public CreerSalleUseCase creerSalleUseCase(SalleService service) {
        return service;
    }

    @Bean
    public RecupererSalleUseCase recupererSalleUseCase(SalleService service) {
        return service;
    }

    @Bean
    public ListerSallesUseCase listerSallesUseCase(SalleService service) {
        return service;
    }

    @Bean
    public RenommerSalleUseCase renommerSalleUseCase(SalleService service) {
        return service;
    }

    @Bean
    public ReaffecterFormationUseCase reaffecterFormationUseCase(SalleService service) {
        return service;
    }

    @Bean
    public SupprimerSalleUseCase supprimerSalleUseCase(SalleService service) {
        return service;
    }
}