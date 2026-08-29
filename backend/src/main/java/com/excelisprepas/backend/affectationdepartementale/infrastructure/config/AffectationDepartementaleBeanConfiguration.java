package com.excelisprepas.backend.affectationdepartementale.infrastructure.config;

import com.excelisprepas.backend.affectationdepartementale.domain.port.in.AjouterEnseignantUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.CopierDepuisSessionUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.ListerRosterUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.in.RetirerEnseignantUseCase;
import com.excelisprepas.backend.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.affectationdepartementale.domain.service.AffectationDepartementaleService;
import com.excelisprepas.backend.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AffectationDepartementaleBeanConfiguration {

    @Bean
    public AffectationDepartementaleService affectationDepartementaleService(
            AffectationDepartementaleRepositoryPort rosterRepository,
            DepartementRepositoryPort departementRepository,
            EnseignantRepositoryPort enseignantRepository,
            SessionAcademiqueRepositoryPort sessionRepository) {
        return new AffectationDepartementaleService(rosterRepository, departementRepository,
                enseignantRepository, sessionRepository);
    }

    @Bean
    public AjouterEnseignantUseCase ajouterEnseignantUseCase(AffectationDepartementaleService affectationDepartementaleService) {
        return affectationDepartementaleService;
    }

    @Bean
    public RetirerEnseignantUseCase retirerEnseignantUseCase(AffectationDepartementaleService affectationDepartementaleService) {
        return affectationDepartementaleService;
    }

    @Bean
    public CopierDepuisSessionUseCase copierDepuisSessionUseCase(AffectationDepartementaleService affectationDepartementaleService) {
        return affectationDepartementaleService;
    }

    @Bean
    public ListerRosterUseCase listerRosterUseCase(AffectationDepartementaleService affectationDepartementaleService) {
        return affectationDepartementaleService;
    }
}