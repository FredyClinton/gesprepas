// financier/infrastructure/config/BilanJournalierBeanConfiguration.java
package com.excelisprepas.backend.financier.infrastructure.config;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.financier.domain.service.BilanJournalierService;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.shared.audit.application.AuditEventHelper;
import org.springframework.beans.factory.annotation.Autowired;
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
                                                         SessionAcademiqueRepositoryPort sessionRepository,
                                                         @Autowired(required = false) PersonnelRepositoryPort personnelRepository,
                                                         @Autowired(required = false) AffectationRepositoryPort affectationRepository,
                                                         @Autowired(required = false) FormationRepositoryPort formationRepository,
                                                         @Autowired(required = false) MotifRepositoryPort motifRepository,
                                                         @Autowired(required = false) AuditEventHelper auditEventHelper) {
        return new BilanJournalierService(bilanRepository, entreeRepository, sortieRepository,
                apprenantRepository, centreRepository, utilisateurRepository, sessionRepository,
                personnelRepository, affectationRepository, formationRepository, motifRepository, auditEventHelper);
    }

    @Bean
    public SoumettreBilanCaissierUseCase soumettreBilanCaissierUseCase(BilanJournalierService bilanJournalierService) {
        return bilanJournalierService;
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

    @Bean
    public ConsulterBilanConsolideDuJourUseCase consulterBilanConsolideDuJourUseCase(BilanJournalierService bilanJournalierService) {
        return bilanJournalierService;
    }
}