package com.excelisprepas.backend.centre.infrastructure.config;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.in.*;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.centre.domain.service.CentreService;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CentreBeanConfiguration {

    @Bean
    public CentreService centreService(CentreRepositoryPort centreRepository,
                                       FormationRepositoryPort formationRepository,
                                       ApprenantRepositoryPort apprenantRepository,
                                       SalleRepositoryPort salleRepository,
                                       AffectationRepositoryPort affectationRepository,
                                       UtilisateurRepositoryPort utilisateurRepository) {
        return new CentreService(centreRepository, formationRepository, apprenantRepository,
                salleRepository, affectationRepository, utilisateurRepository);
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
}