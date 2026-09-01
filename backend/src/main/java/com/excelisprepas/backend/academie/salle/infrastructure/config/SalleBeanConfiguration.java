package com.excelisprepas.backend.academie.salle.infrastructure.config;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.in.*;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.service.SalleService;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SalleBeanConfiguration {

    @Bean
    public SalleService salleService(SalleRepositoryPort salleRepository,
                                     CentreRepositoryPort centreRepository,
                                     FormationRepositoryPort formationRepository,
                                     AffectationRepositoryPort affectationRepository,
                                     SessionAcademiqueRepositoryPort sessionRepository,
                                     com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort abonnementRepository) {
        return new SalleService(salleRepository, centreRepository, formationRepository,
                affectationRepository, sessionRepository, abonnementRepository);
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