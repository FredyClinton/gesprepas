package com.excelisprepas.backend.affectation.infrastructure.config;

import com.excelisprepas.backend.affectation.domain.port.in.CreerCreneauUseCase;
import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.affectation.domain.service.AffectationService;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AffectationBeanConfiguration {

    @Bean
    public CreerCreneauUseCase creerCreneauUseCase(AffectationRepositoryPort affectationRepository,
                                                   CentreRepositoryPort centreRepository,
                                                   FormationRepositoryPort formationRepository,
                                                   SalleRepositoryPort salleRepository,
                                                   MatiereRepositoryPort matiereRepository) {
        return new AffectationService(affectationRepository, centreRepository, formationRepository,
                salleRepository, matiereRepository);
    }
}