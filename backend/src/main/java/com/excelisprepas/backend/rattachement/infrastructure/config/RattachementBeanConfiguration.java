package com.excelisprepas.backend.rattachement.infrastructure.config;

import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.port.in.*;
import com.excelisprepas.backend.rattachement.domain.port.out.AttributionRoleRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.port.out.RattachementCentreRepositoryPort;
import com.excelisprepas.backend.rattachement.domain.service.RattachementRoleService;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RattachementBeanConfiguration {

    @Bean
    public RattachementRoleService rattachementRoleService(RattachementCentreRepositoryPort rattachementRepository,
                                                           AttributionRoleRepositoryPort attributionRepository,
                                                           UtilisateurRepositoryPort utilisateurRepository,
                                                           CentreRepositoryPort centreRepository,
                                                           SessionAcademiqueRepositoryPort sessionRepository) {
        return new RattachementRoleService(rattachementRepository, attributionRepository,
                utilisateurRepository, centreRepository, sessionRepository);
    }

    @Bean
    public RattacherUtilisateurUseCase rattacherUtilisateurUseCase(RattachementRoleService rattachementRoleService) {
        return rattachementRoleService;
    }

    @Bean
    public AffecterCentreUseCase affecterCentreUseCase(RattachementRoleService rattachementRoleService) {
        return rattachementRoleService;
    }

    @Bean
    public AjouterRoleUseCase ajouterRoleUseCase(RattachementRoleService rattachementRoleService) {
        return rattachementRoleService;
    }

    @Bean
    public RetirerRoleUseCase retirerRoleUseCase(RattachementRoleService rattachementRoleService) {
        return rattachementRoleService;
    }

    @Bean
    public RecupererRattachementUseCase recupererRattachementUseCase(RattachementRoleService rattachementRoleService) {
        return rattachementRoleService;
    }

    @Bean
    public ListerRattachementsUseCase listerRattachementsUseCase(RattachementRoleService rattachementRoleService) {
        return rattachementRoleService;
    }

    @Bean
    public ListerRolesUseCase listerRolesUseCase(RattachementRoleService rattachementRoleService) {
        return rattachementRoleService;
    }

    @Bean
    public SupprimerRattachementUseCase supprimerRattachementUseCase(RattachementRoleService rattachementRoleService) {
        return rattachementRoleService;
    }
}