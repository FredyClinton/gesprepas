package com.excelisprepas.backend.centre.infrastructure.config;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.in.*;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.centre.domain.service.CentreService;
import com.excelisprepas.backend.rattachement.domain.port.out.RattachementCentreRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CentreBeanConfiguration {

    @Bean
    public CentreService centreService(CentreRepositoryPort centreRepository,
                                       ApprenantRepositoryPort apprenantRepository,
                                       SalleRepositoryPort salleRepository,
                                       AffectationRepositoryPort affectationRepository,
                                       RattachementCentreRepositoryPort rattachementRepository,
                                       SessionAcademiqueRepositoryPort sessionRepository) {
        return new CentreService(centreRepository, apprenantRepository,
                salleRepository, affectationRepository, rattachementRepository, sessionRepository);
    }

    @Bean
    public CreerCentreUseCase creerCentreUseCase(CentreService centreService) {
        return centreService;
    }

    @Bean
    public RecupererCentreUseCase recupererCentreUseCase(CentreService centreService) {
        return centreService;
    }

    @Bean
    public ListerCentresUseCase listerCentresUseCase(CentreService centreService) {
        return centreService;
    }

    @Bean
    public FermerCentreUseCase fermerCentreUseCase(CentreService centreService) {
        return centreService;
    }

    @Bean
    public RouvrirCentreUseCase rouvrirCentreUseCase(CentreService centreService) {
        return centreService;
    }

    @Bean
    public RenommerCentreUseCase renommerCentreUseCase(CentreService centreService) {
        return centreService;
    }

    @Bean
    public RelocaliserCentreUseCase relocaliserCentreUseCase(CentreService centreService) {
        return centreService;
    }

    @Bean
    public SupprimerCentreUseCase supprimerCentreUseCase(CentreService centreService) {
        return centreService;
    }

    @Bean
    public RejoindreSessionUseCase rejoindreSessionUseCase(CentreService centreService) {
        return centreService;
    }
}