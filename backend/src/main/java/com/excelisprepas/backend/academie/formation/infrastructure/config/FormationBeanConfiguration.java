package com.excelisprepas.backend.academie.formation.infrastructure.config;

import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.in.*;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.service.FormationService;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FormationBeanConfiguration {

    @Bean
    public FormationService formationService(FormationRepositoryPort repository,
                                             MatiereRepositoryPort matiereRepository,
                                             SalleRepositoryPort salleRepository,
                                             AffectationRepositoryPort affectationRepository,
                                             ProgressionRepositoryPort progressionRepository,
                                             CentreFormationAbonnementRepositoryPort abonnementRepository) {
        return new FormationService(repository, matiereRepository,
                salleRepository, affectationRepository, progressionRepository, abonnementRepository);
    }

    @Bean
    public CreerFormationUseCase creerFormationUseCase(FormationService formationService) {
        return formationService;
    }

    @Bean
    public RecupererFormationUseCase recupererFormationUseCase(FormationService formationService) {
        return formationService;
    }

    @Bean
    public ListerFormationsUseCase listerFormationsUseCase(FormationService formationService) {
        return formationService;
    }

    @Bean
    public RenommerFormationUseCase renommerFormationUseCase(FormationService formationService) {
        return formationService;
    }

    @Bean
    public SupprimerFormationUseCase supprimerFormationUseCase(FormationService formationService) {
        return formationService;
    }

    @Bean
    public AssocierMatiereFormationUseCase associerMatiereFormationUseCase(FormationService formationService) {
        return formationService;
    }

    @Bean
    public DissocierMatiereFormationUseCase dissocierMatiereFormationUseCase(FormationService formationService) {
        return formationService;
    }

    @Bean
    public ListerMatieresFormationUseCase listerMatieresFormationUseCase(FormationService formationService) {
        return formationService;
    }
}
