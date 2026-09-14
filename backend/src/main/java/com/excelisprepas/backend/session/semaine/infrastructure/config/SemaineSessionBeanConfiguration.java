package com.excelisprepas.backend.session.semaine.infrastructure.config;

import com.excelisprepas.backend.session.semaine.domain.port.in.AjouterSemaineUseCase;
import com.excelisprepas.backend.session.semaine.domain.port.in.ListerSemainesUseCase;
import com.excelisprepas.backend.session.semaine.domain.service.SemaineSessionService;
import com.excelisprepas.backend.session.semaine.domain.port.out.SemaineSessionRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SemaineSessionBeanConfiguration {

    @Bean
    public ListerSemainesUseCase listerSemainesUseCase(SemaineSessionRepositoryPort repository) {
        return new SemaineSessionService(repository);
    }

    @Bean
    public AjouterSemaineUseCase ajouterSemaineUseCase(SemaineSessionRepositoryPort repository) {
        return new SemaineSessionService(repository);
    }
}