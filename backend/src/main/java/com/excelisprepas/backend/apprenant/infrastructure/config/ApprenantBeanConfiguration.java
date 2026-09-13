package com.excelisprepas.backend.apprenant.infrastructure.config;

import com.excelisprepas.backend.apprenant.domain.port.in.*;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.service.ApprenantService;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.academie.etablissement.domain.port.out.EtablissementRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApprenantBeanConfiguration {

    @Bean
    public ApprenantService apprenantService(ApprenantRepositoryPort apprenantRepository,
                                             CentreRepositoryPort centreRepository,
                                             SessionAcademiqueRepositoryPort sessionRepository,
                                             EtablissementRepositoryPort etablissementRepository) {
        return new ApprenantService(apprenantRepository, centreRepository, sessionRepository, etablissementRepository);
    }

    @Bean
    public CreerApprenantUseCase creerApprenantUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public RecupererApprenantUseCase recupererApprenantUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public ListerApprenantsUseCase listerApprenantsUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public TransfererCentreUseCase transfererCentreUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public SupprimerApprenantUseCase supprimerApprenantUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public ModifierApprenantUseCase modifierApprenantUseCase(ApprenantService apprenantService) {
        return apprenantService;
    }

    @Bean
    public com.excelisprepas.backend.apprenant.domain.service.CursusApprenantService cursusApprenantService(
            ApprenantRepositoryPort apprenantRepository,
            com.excelisprepas.backend.apprenant.domain.port.out.ContratApprenantRepositoryPort contratApprenantRepository,
            com.excelisprepas.backend.apprenant.domain.port.out.InscriptionPhaseFormationRepositoryPort inscriptionPhaseFormationRepository,
            com.excelisprepas.backend.academie.phase.domain.port.out.PhaseRepositoryPort phaseRepository) {
        return new com.excelisprepas.backend.apprenant.domain.service.CursusApprenantService(
                apprenantRepository,
                contratApprenantRepository,
                inscriptionPhaseFormationRepository,
                phaseRepository
        );
    }

    @Bean
    public CreerContratPhaseUseCase creerContratPhaseUseCase(
            com.excelisprepas.backend.apprenant.domain.service.CursusApprenantService cursusApprenantService) {
        return cursusApprenantService;
    }

    @Bean
    public ChangerFormationPhaseUseCase changerFormationPhaseUseCase(
            com.excelisprepas.backend.apprenant.domain.service.CursusApprenantService cursusApprenantService) {
        return cursusApprenantService;
    }

    @Bean
    public RecupererCursusApprenantUseCase recupererCursusApprenantUseCase(
            com.excelisprepas.backend.apprenant.domain.service.CursusApprenantService cursusApprenantService) {
        return cursusApprenantService;
    }
}