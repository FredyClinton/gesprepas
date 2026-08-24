package com.excelisprepas.backend.formation.infrastructure.config;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.in.*;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.formation.domain.service.FormationService;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FormationBeanConfiguration {

    @Bean
    public FormationService formationService(FormationRepositoryPort repository,
                                             CentreRepositoryPort centreRepository,
                                             SessionAcademiqueRepositoryPort sessionRepository,
                                             SalleRepositoryPort salleRepository,
                                             AffectationRepositoryPort affectationRepository,
                                             ApprenantRepositoryPort apprenantRepository,
                                             ProgressionRepositoryPort progressionRepository) {
        return new FormationService(repository, centreRepository, sessionRepository,
                salleRepository, affectationRepository, apprenantRepository, progressionRepository);
    }

    @Bean
    public CreerFormationUseCase creerFormationUseCase(FormationService service) {
        return service;
    }

    @Bean
    public RecupererFormationUseCase recupererFormationUseCase(FormationService service) {
        return service;
    }

    @Bean
    public ListerFormationsUseCase listerFormationsUseCase(FormationService service) {
        return service;
    }

    @Bean
    public RenommerFormationUseCase renommerFormationUseCase(FormationService service) {
        return service;
    }

    @Bean
    public SupprimerFormationUseCase supprimerFormationUseCase(FormationService service) {
        return service;
    }
}