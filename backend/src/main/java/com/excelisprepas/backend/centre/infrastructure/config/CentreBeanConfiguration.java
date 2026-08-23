package com.excelisprepas.backend.centre.infrastructure.config;


import com.excelisprepas.backend.centre.domain.port.in.CreerCentreUseCase;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.centre.domain.service.CentreService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CentreBeanConfiguration {

    @Bean
    public CreerCentreUseCase creerCentreUseCase(CentreRepositoryPort centreRepositoryPort) {
        return new CentreService(centreRepositoryPort);
    }
}