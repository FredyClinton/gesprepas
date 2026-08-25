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
    public CreerSalleUseCase creerSalleUseCase(SalleService salleService) {
        return salleService;
    }

    @Bean
    public RecupererSalleUseCase recupererSalleUseCase(SalleService salleService) {
        return salleService;
    }

    @Bean
    public ListerSallesUseCase listerSallesUseCase(SalleService salleService) {
        return salleService;
    }

    @Bean
    public RenommerSalleUseCase renommerSalleUseCase(SalleService salleService) {
        return salleService;
    }

    @Bean
    public ReaffecterFormationUseCase reaffecterFormationUseCase(SalleService salleService) {
        return salleService;
    }

    @Bean
    public SupprimerSalleUseCase supprimerSalleUseCase(SalleService salleService) {
        return salleService;
    }
}