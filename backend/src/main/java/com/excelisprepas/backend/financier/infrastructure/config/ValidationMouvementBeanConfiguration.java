package com.excelisprepas.backend.financier.infrastructure.config;

import com.excelisprepas.backend.financier.domain.port.in.ValiderMouvementUseCase;
import com.excelisprepas.backend.financier.domain.port.out.MouvementFinancierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.ValidationMouvementRepositoryPort;
import com.excelisprepas.backend.financier.domain.service.ValidationMouvementService;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ValidationMouvementBeanConfiguration {

    @Bean
    public ValidationMouvementService validationMouvementService(MouvementFinancierRepositoryPort mouvementRepository,
                                                                 ValidationMouvementRepositoryPort validationRepository,
                                                                 UtilisateurRepositoryPort utilisateurRepository) {
        return new ValidationMouvementService(mouvementRepository, validationRepository, utilisateurRepository);
    }

    @Bean
    public ValiderMouvementUseCase validerMouvementUseCase(ValidationMouvementService service) {
        return service;
    }
}