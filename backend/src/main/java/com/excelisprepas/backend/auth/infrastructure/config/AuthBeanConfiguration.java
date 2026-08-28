package com.excelisprepas.backend.auth.infrastructure.config;

import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.auth.domain.service.AuthentificationService;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AuthBeanConfiguration {

    @Bean
    public AuthentificationService authentificationService(UtilisateurRepositoryPort utilisateurRepositoryPort,
                                                            PasswordEncoderPort passwordEncoderPort) {
        return new AuthentificationService(utilisateurRepositoryPort, passwordEncoderPort);
    }

    @Bean
    public SeConnecterUseCase seConnecterUseCase(AuthentificationService authentificationService) {
        return authentificationService;
    }
}
