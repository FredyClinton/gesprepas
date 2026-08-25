package com.excelisprepas.backend.affectation.infrastructure.config;

import com.excelisprepas.backend.affectation.domain.port.in.*;
import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.affectation.domain.service.AffectationService;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.salle.domain.port.out.SalleRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AffectationBeanConfiguration {

    @Bean
    public AffectationService affectationService(AffectationRepositoryPort affectationRepository,
                                                 CentreRepositoryPort centreRepository,
                                                 FormationRepositoryPort formationRepository,
                                                 SalleRepositoryPort salleRepository,
                                                 MatiereRepositoryPort matiereRepository,
                                                 EnseignantRepositoryPort enseignantRepository,
                                                 SessionAcademiqueRepositoryPort sessionRepository) {
        return new AffectationService(affectationRepository, centreRepository, formationRepository,
                salleRepository, matiereRepository, enseignantRepository, sessionRepository);
    }

    @Bean
    public CreerCreneauUseCase creerCreneauUseCase(AffectationService affectationService) {
        return affectationService;
    }

    @Bean
    public AssignerEnseignantUseCase assignerEnseignantUseCase(AffectationService affectationService) {
        return affectationService;
    }

    @Bean
    public MarquerEffectueeUseCase marquerEffectueeUseCase(AffectationService affectationService) {
        return affectationService;
    }

    @Bean
    public AnnulerAffectationUseCase annulerAffectationUseCase(AffectationService affectationService) {
        return affectationService;
    }

    @Bean
    public ListerAffectationUseCase listerAffectationUseCase(AffectationService affectationService) {
        return affectationService;
    }
}