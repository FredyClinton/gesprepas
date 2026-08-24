package com.excelisprepas.backend.matiere.infrastructure.config;

import com.excelisprepas.backend.matiere.domain.port.in.CreerMatiereUseCase;
import com.excelisprepas.backend.matiere.domain.port.out.MatiereRepositoryPort;
import com.excelisprepas.backend.matiere.domain.service.MatiereService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MatiereBeanConfiguration {

    @Bean
    public CreerMatiereUseCase creerMatiereUseCase(MatiereRepositoryPort repository) {
        return new MatiereService(repository);
    }
}