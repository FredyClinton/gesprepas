package com.excelisprepas.backend.gelenseignants.infrastructure.config;

import com.excelisprepas.backend.gelenseignants.domain.port.in.ConsulterGelEnseignantsUseCase;
import com.excelisprepas.backend.gelenseignants.domain.port.in.ModifierGelEnseignantsUseCase;
import com.excelisprepas.backend.gelenseignants.domain.port.in.VerifierAutoriseGestionEnseignantsUseCase;
import com.excelisprepas.backend.gelenseignants.domain.port.out.GelEnseignantsRepositoryPort;
import com.excelisprepas.backend.gelenseignants.domain.service.GelEnseignantsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GelEnseignantsBeanConfiguration {

    @Bean
    public GelEnseignantsService gelEnseignantsService(GelEnseignantsRepositoryPort repository) {
        return new GelEnseignantsService(repository);
    }

    @Bean
    public ConsulterGelEnseignantsUseCase consulterGelEnseignantsUseCase(GelEnseignantsService gelEnseignantsService) {
        return gelEnseignantsService;
    }

    @Bean
    public ModifierGelEnseignantsUseCase modifierGelEnseignantsUseCase(GelEnseignantsService gelEnseignantsService) {
        return gelEnseignantsService;
    }

    @Bean
    public VerifierAutoriseGestionEnseignantsUseCase verifierAutoriseGestionEnseignantsUseCase(GelEnseignantsService gelEnseignantsService) {
        return gelEnseignantsService;
    }
}
