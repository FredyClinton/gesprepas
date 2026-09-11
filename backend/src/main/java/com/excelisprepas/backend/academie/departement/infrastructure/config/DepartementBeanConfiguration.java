package com.excelisprepas.backend.academie.departement.infrastructure.config;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.port.in.*;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.service.DepartementService;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.progression.domain.port.out.ProgressionRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DepartementBeanConfiguration {

    @Bean
    public DepartementService departementService(DepartementRepositoryPort departementRepository,
                                                 MatiereRepositoryPort matiereRepository,
                                                 AffectationDepartementaleRepositoryPort rosterRepository,
                                                 AffectationRepositoryPort affectationRepository,
                                                 ProgressionRepositoryPort progressionRepository,
                                                 FormationRepositoryPort formationRepository,
                                                 UtilisateurRepositoryPort utilisateurRepository) {
        return new DepartementService(
                departementRepository,
                matiereRepository,
                rosterRepository,
                affectationRepository,
                progressionRepository,
                formationRepository,
                utilisateurRepository
        );
    }

    @Bean
    public CreerDepartementUseCase creerDepartementUseCase(DepartementService departementService) {
        return departementService;
    }

    @Bean
    public RecupererDepartementUseCase recupererDepartementUseCase(DepartementService departementService) {
        return departementService;
    }

    @Bean
    public ListerDepartementsUseCase listerDepartementsUseCase(DepartementService departementService) {
        return departementService;
    }

    @Bean
    public RenommerDepartementUseCase renommerDepartementUseCase(DepartementService departementService) {
        return departementService;
    }

    @Bean
    public SupprimerDepartementUseCase supprimerDepartementUseCase(DepartementService departementService) {
        return departementService;
    }

    @Bean
    public AssignerChefDepartementUseCase assignerChefDepartementUseCase(DepartementService departementService) {
        return departementService;
    }
}