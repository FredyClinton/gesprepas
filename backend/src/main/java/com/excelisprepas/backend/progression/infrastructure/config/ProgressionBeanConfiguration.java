package com.excelisprepas.backend.progression.infrastructure.config;

import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.progression.domain.port.in.CreerProgressionUseCase;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.progression.domain.service.ProgressionService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ProgressionBeanConfiguration {

    @Bean
    public CreerProgressionUseCase creerProgressionUseCase(ProgressionRepositoryPort progressionRepository,
                                                           FormationRepositoryPort formationRepository,
                                                           MatiereRepositoryPort matiereRepository) {
        return new ProgressionService(progressionRepository, formationRepository, matiereRepository);
    }
}