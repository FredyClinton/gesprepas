package com.excelisprepas.backend.remuneration.infrastructure.config;

import com.excelisprepas.backend.academie.affectation.domain.port.out.AffectationRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.in.SaisirSortieUseCase;
import com.excelisprepas.backend.personnel.domain.port.out.EnseignantRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueSalairePersonnelRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.HistoriqueTarifRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import com.excelisprepas.backend.remuneration.domain.port.in.*;
import com.excelisprepas.backend.remuneration.domain.port.out.BordereauPaiePersonnelRepositoryPort;
import com.excelisprepas.backend.remuneration.domain.port.out.BordereauPaieRepositoryPort;
import com.excelisprepas.backend.remuneration.domain.service.RemunerationPersonnelService;
import com.excelisprepas.backend.remuneration.domain.service.RemunerationService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RemunerationBeanConfiguration {

    @Bean
    public RemunerationService remunerationService(
            AffectationRepositoryPort affectationRepository,
            EnseignantRepositoryPort enseignantRepository,
            HistoriqueTarifRepositoryPort historiqueTarifRepository,
            BordereauPaieRepositoryPort bordereauPaieRepository,
            SaisirSortieUseCase saisirSortieUseCase) {
        return new RemunerationService(
                affectationRepository, enseignantRepository, historiqueTarifRepository,
                bordereauPaieRepository, saisirSortieUseCase);
    }

    @Bean
    public PreparerBordereauPaieUseCase preparerBordereauPaieUseCase(RemunerationService remunerationService) {
        return remunerationService;
    }

    @Bean
    public ValiderBordereauPaieUseCase validerBordereauPaieUseCase(RemunerationService remunerationService) {
        return remunerationService;
    }

    @Bean
    public RemunerationPersonnelService remunerationPersonnelService(
            PersonnelRepositoryPort personnelRepository,
            HistoriqueSalairePersonnelRepositoryPort historiqueSalaireRepository,
            BordereauPaiePersonnelRepositoryPort bordereauPaiePersonnelRepository,
            SaisirSortieUseCase saisirSortieUseCase) {
        return new RemunerationPersonnelService(
                personnelRepository, historiqueSalaireRepository,
                bordereauPaiePersonnelRepository, saisirSortieUseCase);
    }

    @Bean
    public PreparerBordereauPersonnelUseCase preparerBordereauPersonnelUseCase(RemunerationPersonnelService remunerationPersonnelService) {
        return remunerationPersonnelService;
    }

    @Bean
    public ValiderBordereauPersonnelUseCase validerBordereauPersonnelUseCase(RemunerationPersonnelService remunerationPersonnelService) {
        return remunerationPersonnelService;
    }

    @Bean
    public ConsulterPaiePersonnelUseCase consulterPaiePersonnelUseCase(RemunerationPersonnelService remunerationPersonnelService) {
        return remunerationPersonnelService;
    }
}
