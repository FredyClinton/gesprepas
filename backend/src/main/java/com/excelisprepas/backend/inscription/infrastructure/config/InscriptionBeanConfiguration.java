package com.excelisprepas.backend.inscription.infrastructure.config;

import com.excelisprepas.backend.inscription.domain.port.in.CreerDossierInscriptionUseCase;
import com.excelisprepas.backend.inscription.domain.port.in.RecupererDossierInscriptionUseCase;
import com.excelisprepas.backend.inscription.domain.port.out.DossierInscriptionRepositoryPort;
import com.excelisprepas.backend.inscription.domain.service.InscriptionService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class InscriptionBeanConfiguration {

    @Bean
    public InscriptionService inscriptionService(DossierInscriptionRepositoryPort repositoryPort) {
        return new InscriptionService(repositoryPort);
    }

    @Bean
    public CreerDossierInscriptionUseCase creerDossierInscriptionUseCase(InscriptionService inscriptionService) {
        return inscriptionService;
    }

    @Bean
    public RecupererDossierInscriptionUseCase recupererDossierInscriptionUseCase(InscriptionService inscriptionService) {
        return inscriptionService;
    }
}

