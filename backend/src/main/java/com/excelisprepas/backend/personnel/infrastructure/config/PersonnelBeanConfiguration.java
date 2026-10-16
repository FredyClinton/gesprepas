package com.excelisprepas.backend.personnel.infrastructure.config;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.academie.departement.domain.port.out.DepartementRepositoryPort;
import com.excelisprepas.backend.gelenseignants.domain.port.in.VerifierAutoriseGestionEnseignantsUseCase;
import com.excelisprepas.backend.personnel.domain.port.in.*;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.PasswordEncoderPort;
import com.excelisprepas.backend.personnel.domain.port.out.UtilisateurRepositoryPort;
import com.excelisprepas.backend.personnel.domain.service.EnseignantService;
import com.excelisprepas.backend.personnel.domain.service.UtilisateurService;
import com.excelisprepas.backend.academie.affectationdepartementale.domain.port.out.AffectationDepartementaleRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PersonnelBeanConfiguration {

    @Bean
    public UtilisateurService utilisateurService(UtilisateurRepositoryPort utilisateurRepositoryPort,
                                                 PasswordEncoderPort passwordEncoderPort,
                                                 CentreRepositoryPort centreRepositoryPort,
                                                 com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort personnelRepositoryPort) {
        return new UtilisateurService(utilisateurRepositoryPort, passwordEncoderPort,
                centreRepositoryPort, personnelRepositoryPort);
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
    public ModifierUtilisateurUseCase modifierUtilisateurUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public RevoquerCompteUtilisateurUseCase revoquerCompteUtilisateurUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public CreerComptePersonnelUseCase creerComptePersonnelUseCase(UtilisateurService utilisateurService) {
        return utilisateurService;
    }

    @Bean
    public EnseignantService enseignantService(EnseignantRepositoryPort enseignantRepositoryPort,
                                               AffectationRepositoryPort affectationRepositoryPort,
                                               VerifierAutoriseGestionEnseignantsUseCase verifierAutoriseGestionEnseignantsUseCase,
                                               SessionAcademiqueRepositoryPort sessionAcademiqueRepositoryPort,
                                               AffectationDepartementaleRepositoryPort affectationDepartementaleRepositoryPort,
                                               DepartementRepositoryPort departementRepositoryPort) {
        return new EnseignantService(enseignantRepositoryPort, affectationRepositoryPort,
                verifierAutoriseGestionEnseignantsUseCase, sessionAcademiqueRepositoryPort,
                affectationDepartementaleRepositoryPort, departementRepositoryPort);
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

    @Bean
    public ConsulterAncienneteEnseignantUseCase consulterAncienneteEnseignantUseCase(EnseignantService enseignantService) {
        return enseignantService;
    }


    @Bean
    public com.excelisprepas.backend.personnel.domain.service.PersonnelService personnelService(
            com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort personnelRepositoryPort,
            com.excelisprepas.backend.personnel.domain.port.out.HistoriqueSalairePersonnelRepositoryPort historiqueSalairePersonnelRepositoryPort,
            UtilisateurRepositoryPort utilisateurRepositoryPort) {
        return new com.excelisprepas.backend.personnel.domain.service.PersonnelService(
                personnelRepositoryPort, historiqueSalairePersonnelRepositoryPort, utilisateurRepositoryPort);
    }

    @Bean
    public CreerPersonnelUseCase creerPersonnelUseCase(com.excelisprepas.backend.personnel.domain.service.PersonnelService personnelService) {
        return personnelService;
    }

    @Bean
    public ListerPersonnelUseCase listerPersonnelUseCase(com.excelisprepas.backend.personnel.domain.service.PersonnelService personnelService) {
        return personnelService;
    }

    @Bean
    public DefinirSalairePersonnelUseCase definirSalairePersonnelUseCase(com.excelisprepas.backend.personnel.domain.service.PersonnelService personnelService) {
        return personnelService;
    }

    @Bean
    public ConsulterHistoriqueSalairePersonnelUseCase consulterHistoriqueSalairePersonnelUseCase(com.excelisprepas.backend.personnel.domain.service.PersonnelService personnelService) {
        return personnelService;
    }

    @Bean
    public RecupererPersonnelUseCase recupererPersonnelUseCase(com.excelisprepas.backend.personnel.domain.service.PersonnelService personnelService) {
        return personnelService;
    }

    @Bean
    public ModifierPersonnelUseCase modifierPersonnelUseCase(com.excelisprepas.backend.personnel.domain.service.PersonnelService personnelService) {
        return personnelService;
    }

    @Bean
    public SupprimerPersonnelUseCase supprimerPersonnelUseCase(com.excelisprepas.backend.personnel.domain.service.PersonnelService personnelService) {
        return personnelService;
    }

    @Bean
    public com.excelisprepas.backend.personnel.domain.service.AccesPersonnelService accesPersonnelService(
            com.excelisprepas.backend.personnel.domain.port.out.AccesPersonnelRepositoryPort accesPersonnelRepositoryPort,
            com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort personnelRepositoryPort,
            UtilisateurRepositoryPort utilisateurRepositoryPort,
            com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort sessionAcademiqueRepositoryPort) {
        return new com.excelisprepas.backend.personnel.domain.service.AccesPersonnelService(
                accesPersonnelRepositoryPort, personnelRepositoryPort, utilisateurRepositoryPort, sessionAcademiqueRepositoryPort);
    }

    @Bean
    public GererAccesPersonnelUseCase gererAccesPersonnelUseCase(
            com.excelisprepas.backend.personnel.domain.service.AccesPersonnelService accesPersonnelService) {
        return accesPersonnelService;
    }

    @Bean
    public ListerAccesPersonnelUseCase listerAccesPersonnelUseCase(
            com.excelisprepas.backend.personnel.domain.service.AccesPersonnelService accesPersonnelService) {
        return accesPersonnelService;
    }
}
