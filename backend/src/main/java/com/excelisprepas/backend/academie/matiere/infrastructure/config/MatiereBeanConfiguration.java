package com.excelisprepas.backend.academie.matiere.infrastructure.config;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.port.in.*;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.service.MatiereService;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MatiereBeanConfiguration {

    @Bean
    public MatiereService matiereService(MatiereRepositoryPort repository,
                                         DepartementRepositoryPort departementRepository,
                                         AffectationRepositoryPort affectationRepository,
                                         ProgressionRepositoryPort progressionRepository,
                                         com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort formationRepository) {
        return new MatiereService(repository, departementRepository, affectationRepository, progressionRepository, formationRepository);
    }

    @Bean
    public CreerMatiereUseCase creerMatiereUseCase(MatiereService matiereService) {
        return matiereService;
    }

    @Bean
    public RecupererMatiereUseCase recupererMatiereUseCase(MatiereService matiereService) {
        return matiereService;
    }

    @Bean
    public ListerMatieresUseCase listerMatieresUseCase(MatiereService matiereService) {
        return matiereService;
    }

    @Bean
    public RenommerMatiereUseCase renommerMatiereUseCase(MatiereService matiereService) {
        return matiereService;
    }

    @Bean
    public SupprimerMatiereUseCase supprimerMatiereUseCase(MatiereService matiereService) {
        return matiereService;
    }
}