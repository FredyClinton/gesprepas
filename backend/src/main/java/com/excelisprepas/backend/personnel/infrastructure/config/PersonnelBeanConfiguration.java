package com.excelisprepas.backend.personnel.infrastructure.config;

import com.excelisprepas.backend.personnel.domain.port.in.CreerEnseignantUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.CreerUtilisateurUseCase;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.personnel.domain.service.EnseignantService;
import com.excelisprepas.backend.personnel.domain.service.UtilisateurService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PersonnelBeanConfiguration {

    @Bean
    public CreerEnseignantUseCase creerEnseignantUseCase(EnseignantRepositoryPort enseignantRepositoryPort) {
        return new EnseignantService(enseignantRepositoryPort);
    }

    @Bean
    public CreerUtilisateurUseCase creerUtilisateurUseCase(UtilisateurRepositoryPort utilisateurRepositoryPort,
                                                           PasswordEncoderPort passwordEncoderPort) {
        return new UtilisateurService(utilisateurRepositoryPort, passwordEncoderPort);
    }
}
