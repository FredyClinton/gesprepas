package com.excelisprepas.backend.progression.infrastructure.config;

import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.progression.domain.port.in.*;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.progression.domain.service.ProgressionService;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProgressionBeanConfiguration {

    @Bean
    public ProgressionService progressionService(ProgressionRepositoryPort progressionRepository,
                                                 FormationRepositoryPort formationRepository,
                                                 MatiereRepositoryPort matiereRepository,
                                                 SessionAcademiqueRepositoryPort sessionRepository) {
        return new ProgressionService(progressionRepository, formationRepository, matiereRepository, sessionRepository);
    }

    @Bean
    public CreerProgressionUseCase creerProgressionUseCase(ProgressionService progressionService) {
        return progressionService;
    }

    @Bean
    public RecupererProgressionUseCase recupererProgressionUseCase(ProgressionService progressionService) {
        return progressionService;
    }

    @Bean
    public ListerProgressionsUseCase listerProgressionsUseCase(ProgressionService progressionService) {
        return progressionService;
    }

    @Bean
    public MettreAJourContenuUseCase mettreAJourContenuUseCase(ProgressionService progressionService) {
        return progressionService;
    }

    @Bean
    public SupprimerProgressionUseCase supprimerProgressionUseCase(ProgressionService progressionService) {
        return progressionService;
    }
}