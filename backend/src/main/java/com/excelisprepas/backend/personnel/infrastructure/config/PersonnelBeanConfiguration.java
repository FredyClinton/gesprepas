package com.excelisprepas.backend.personnel.infrastructure.config;

import com.excelisprepas.backend.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.in.*;
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
    public UtilisateurService utilisateurService(UtilisateurRepositoryPort utilisateurRepositoryPort,
                                                 PasswordEncoderPort passwordEncoderPort,
                                                 CentreRepositoryPort centreRepositoryPort) {
        return new UtilisateurService(utilisateurRepositoryPort, passwordEncoderPort, centreRepositoryPort);
    }

    @Bean
    public CreerUtilisateurUseCase creerUtilisateurUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public RecupererUtilisateurUseCase recupererUtilisateurUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public ListerUtilisateursUseCase listerUtilisateursUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public ChangerEmailUseCase changerEmailUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public ChangerMotDePasseUseCase changerMotDePasseUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public RattacherCentreUseCase rattacherCentreUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public DetacherCentreUseCase detacherCentreUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public SupprimerUtilisateurUseCase supprimerUtilisateurUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public EnseignantService enseignantService(EnseignantRepositoryPort enseignantRepositoryPort,
                                               AffectationRepositoryPort affectationRepositoryPort) {
        return new EnseignantService(enseignantRepositoryPort, affectationRepositoryPort);
    }

    @Bean
    public CreerEnseignantUseCase creerEnseignantUseCase(EnseignantService enseignantService) {
        return enseignantService;
    }

    @Bean
    public RecupererEnseignantUseCase recupererEnseignantUseCase(EnseignantService enseignantService) {
        return enseignantService;
    }

    @Bean
    public ListerEnseignantsUseCase listerEnseignantsUseCase(EnseignantService enseignantService) {
        return enseignantService;
    }

    @Bean
    public RenommerEnseignantUseCase renommerEnseignantUseCase(EnseignantService enseignantService) {
        return enseignantService;
    }

    @Bean
    public ModifierCoutParSeanceUseCase modifierCoutParSeanceUseCase(EnseignantService enseignantService) {
        return enseignantService;
    }

    @Bean
    public SupprimerEnseignantUseCase supprimerEnseignantUseCase(EnseignantService enseignantService) {
        return enseignantService;
    }

    @Bean
    public SuspendreEnseignantUseCase suspendreEnseignantUseCase(EnseignantService enseignantService) {
        return enseignantService;
    }

    @Bean
    public ReactiverEnseignantUseCase reactiverEnseignantUseCase(EnseignantService enseignantService) {
        return enseignantService;
    }
}