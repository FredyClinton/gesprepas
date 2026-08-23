package com.excelisprepas.backend.session.config;


import com.excelisprepas.backend.session.domain.port.in.CreerSessionAcademiqueUseCase;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import com.excelisprepas.backend.session.domain.service.SessionAcademiqueService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SessionAcademiqueBeanConfiguration {

    @Bean
    public CreerSessionAcademiqueUseCase creerSessionAcademiqueUseCase(SessionAcademiqueRepositoryPort repository) {
        return new SessionAcademiqueService(repository);
    }
}
