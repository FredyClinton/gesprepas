package com.excelisprepas.backend.academie.quota.infrastructure.config;

import com.excelisprepas.backend.academie.formation.domain.port.out.FormationRepositoryPort;
import com.excelisprepas.backend.academie.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.academie.quota.domain.port.in.DefinirQuotaUseCase;
import com.excelisprepas.backend.academie.quota.domain.port.in.ListerQuotasUseCase;
import com.excelisprepas.backend.academie.quota.domain.port.out.QuotaHebdomadaireRepositoryPort;
import com.excelisprepas.backend.academie.quota.domain.service.QuotaHebdomadaireService;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class QuotaHebdomadaireBeanConfiguration {

    @Bean
    public QuotaHebdomadaireService quotaHebdomadaireService(QuotaHebdomadaireRepositoryPort quotaRepository,
                                                              FormationRepositoryPort formationRepository,
                                                              MatiereRepositoryPort matiereRepository,
                                                              SessionAcademiqueRepositoryPort sessionRepository) {
        return new QuotaHebdomadaireService(quotaRepository, formationRepository, matiereRepository, sessionRepository);
    }

    @Bean
    public DefinirQuotaUseCase definirQuotaUseCase(QuotaHebdomadaireService quotaHebdomadaireService) {
        return quotaHebdomadaireService;
    }

    @Bean
    public ListerQuotasUseCase listerQuotasUseCase(QuotaHebdomadaireService quotaHebdomadaireService) {
        return quotaHebdomadaireService;
    }
}
