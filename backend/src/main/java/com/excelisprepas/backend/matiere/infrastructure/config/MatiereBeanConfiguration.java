package com.excelisprepas.backend.matiere.infrastructure.config;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.in.*;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.matiere.domain.service.MatiereService;
import com.excelisprepas.backend.progression.domain.port.out.ProgressionRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MatiereBeanConfiguration {

    @Bean
    public MatiereService matiereService(MatiereRepositoryPort repository,
                                         DepartementRepositoryPort departementRepository,
                                         AffectationRepositoryPort affectationRepository,
                                         ProgressionRepositoryPort progressionRepository) {
        return new MatiereService(repository, departementRepository, affectationRepository, progressionRepository);
    }

    @Bean
    public CreerMatiereUseCase creerMatiereUseCase(MatiereService service) {
        return service;
    }

    @Bean
    public RecupererMatiereUseCase recupererMatiereUseCase(MatiereService service) {
        return service;
    }

    @Bean
    public ListerMatieresUseCase listerMatieresUseCase(MatiereService service) {
        return service;
    }

    @Bean
    public RenommerMatiereUseCase renommerMatiereUseCase(MatiereService service) {
        return service;
    }

    @Bean
    public SupprimerMatiereUseCase supprimerMatiereUseCase(MatiereService service) {
        return service;
    }
}