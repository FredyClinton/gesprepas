package com.excelisprepas.backend.auth.infrastructure.config;

import com.excelisprepas.backend.auth.domain.port.in.RafraichirTokenUseCase;
import com.excelisprepas.backend.auth.domain.port.in.SeConnecterUseCase;
import com.excelisprepas.backend.auth.domain.port.in.SeDeconnecterUseCase;
import com.excelisprepas.backend.auth.domain.port.out.RefreshTokenRepositoryPort;
import com.excelisprepas.backend.auth.domain.port.out.TokenPort;
import com.excelisprepas.backend.auth.domain.service.AuthentificationService;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class AuthBeanConfiguration {

    @Bean
    public AuthentificationService authentificationService(UtilisateurRepositoryPort utilisateurRepositoryPort,
                                                            PasswordEncoderPort passwordEncoderPort,
                                                            TokenPort tokenPort,
                                                            RefreshTokenRepositoryPort refreshTokenRepositoryPort,
                                                            @Value("${app.jwt.refresh-token-ttl-days}") long dureeDeVieJours) {
        return new AuthentificationService(utilisateurRepositoryPort, passwordEncoderPort, tokenPort,
                refreshTokenRepositoryPort, Duration.ofDays(dureeDeVieJours));
    }

    @Bean
    public SeConnecterUseCase seConnecterUseCase(AuthentificationService authentificationService) {
        return authentificationService;
    }

    @Bean
    public RafraichirTokenUseCase rafraichirTokenUseCase(AuthentificationService authentificationService) {
        return authentificationService;
    }

    @Bean
    public SeDeconnecterUseCase seDeconnecterUseCase(AuthentificationService authentificationService) {
        return authentificationService;
    }
}
