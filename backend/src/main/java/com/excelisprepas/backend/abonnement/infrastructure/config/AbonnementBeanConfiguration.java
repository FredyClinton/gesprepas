package com.excelisprepas.backend.abonnement.infrastructure.config;

import com.excelisprepas.backend.abonnement.domain.port.in.AbonnerCentreFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.DesabonnerCentreFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.ListerCentresAbonnesParFormationUseCase;
import com.excelisprepas.backend.abonnement.domain.port.in.ListerFormationsAbonneesParCentreUseCase;
import com.excelisprepas.backend.abonnement.domain.port.out.CentreFormationAbonnementRepositoryPort;
import com.excelisprepas.backend.abonnement.domain.service.AbonnementService;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.salle.domain.port.out.SalleRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AbonnementBeanConfiguration {

    @Bean
    public AbonnementService abonnementService(CentreFormationAbonnementRepositoryPort abonnementRepository,
                                               CentreRepositoryPort centreRepository,
                                               FormationRepositoryPort formationRepository,
                                               SalleRepositoryPort salleRepository,
                                               com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort sessionRepository) {
        return new AbonnementService(abonnementRepository, centreRepository, formationRepository, salleRepository, sessionRepository);
    }

    @Bean
    public AbonnerCentreFormationUseCase abonnerCentreFormationUseCase(AbonnementService abonnementService) {
        return abonnementService;
    }

    @Bean
    public DesabonnerCentreFormationUseCase desabonnerCentreFormationUseCase(AbonnementService abonnementService) {
        return abonnementService;
    }

    @Bean
    public ListerFormationsAbonneesParCentreUseCase listerFormationsAbonneesParCentreUseCase(AbonnementService abonnementService) {
        return abonnementService;
    }

    @Bean
    public ListerCentresAbonnesParFormationUseCase listerCentresAbonnesParFormationUseCase(AbonnementService abonnementService) {
        return abonnementService;
    }
}
