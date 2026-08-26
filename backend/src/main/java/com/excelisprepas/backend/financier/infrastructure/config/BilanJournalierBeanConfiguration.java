// financier/infrastructure/config/BilanJournalierBeanConfiguration.java
package com.excelisprepas.backend.financier.infrastructure.config;

import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.in.ConsulterBilanDuJourUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ConsulterRepartitionParFormationUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ValiderBilanChefCentreUseCase;
import com.excelisprepas.backend.financier.domain.port.in.ValiderBilanControleurUseCase;
import com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.financier.domain.service.BilanJournalierService;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BilanJournalierBeanConfiguration {

    @Bean
    public BilanJournalierService bilanJournalierService(BilanJournalierRepositoryPort bilanRepository,
                                                         EntreeRepositoryPort entreeRepository,
                                                         SortieRepositoryPort sortieRepository,
                                                         ApprenantRepositoryPort apprenantRepository,
                                                         CentreRepositoryPort centreRepository,
                                                         UtilisateurRepositoryPort utilisateurRepository,
                                                         SessionAcademiqueRepositoryPort sessionRepository) {
        return new BilanJournalierService(bilanRepository, entreeRepository, sortieRepository,
                apprenantRepository, centreRepository, utilisateurRepository, sessionRepository);
    }

    @Bean
    public ValiderBilanChefCentreUseCase validerBilanChefCentreUseCase(BilanJournalierService bilanJournalierService) {
        return bilanJournalierService;
    }

    @Bean
    public ValiderBilanControleurUseCase validerBilanControleurUseCase(BilanJournalierService bilanJournalierService) {
        return bilanJournalierService;
    }

    @Bean
    public ConsulterBilanDuJourUseCase consulterBilanDuJourUseCase(BilanJournalierService bilanJournalierService) {
        return bilanJournalierService;
    }

    @Bean
    public ConsulterRepartitionParFormationUseCase consulterRepartitionParFormationUseCase(BilanJournalierService bilanJournalierService) {
        return bilanJournalierService;
    }
}