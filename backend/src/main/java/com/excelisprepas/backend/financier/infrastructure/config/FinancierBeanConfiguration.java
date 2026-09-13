package com.excelisprepas.backend.financier.infrastructure.config;

import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.MouvementFinancierRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.out.SortieRepositoryPort;
import com.excelisprepas.backend.financier.domain.service.MotifService;
import com.excelisprepas.backend.financier.domain.service.MouvementFinancierService;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FinancierBeanConfiguration {

    @Bean
    public MotifService motifService(MotifRepositoryPort motifRepository) {
        return new MotifService(motifRepository);
    }

    @Bean
    public CreerMotifUseCase creerMotifUseCase(MotifService motifService) {
        return motifService;
    }

    @Bean
    public ModifierMotifUseCase modifierMotifUseCase(MotifService motifService) {
        return motifService;
    }

    @Bean
    public DesactiverMotifUseCase desactiverMotifUseCase(MotifService motifService) {
        return motifService;
    }

    @Bean
    public ReactiverMotifUseCase reactiverMotifUseCase(MotifService motifService) {
        return motifService;
    }

    @Bean
    public ListerMotifsUseCase listerMotifsUseCase(MotifService motifService) {
        return motifService;
    }

    @Bean
    public MouvementFinancierService mouvementFinancierService(EntreeRepositoryPort entreeRepository,
                                                               SortieRepositoryPort sortieRepository,
                                                               MotifRepositoryPort motifRepository,
                                                               CentreRepositoryPort centreRepository,
                                                               ApprenantRepositoryPort apprenantRepository,
                                                               SessionAcademiqueRepositoryPort sessionRepository,
                                                               MouvementFinancierRepositoryPort mouvementRepository,
                                                               com.excelisprepas.backend.inscription.domain.port.out.DossierInscriptionRepositoryPort dossierInscriptionRepository,
                                                               com.excelisprepas.backend.apprenant.domain.port.out.ContratApprenantRepositoryPort contratApprenantRepository,
                                                               com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort bilanRepository,
                                                               com.excelisprepas.backend.livre.domain.port.out.VenteLivreRepositoryPort venteLivreRepository) {
        return new MouvementFinancierService(entreeRepository, sortieRepository, motifRepository,
                centreRepository, apprenantRepository, sessionRepository, mouvementRepository,
                dossierInscriptionRepository, contratApprenantRepository, bilanRepository, venteLivreRepository);
    }


    @Bean
    public RecupererMouvementUseCase recupererMouvementUseCase(MouvementFinancierService mouvementFinancierService) {
        return mouvementFinancierService;
    }

    @Bean
    public ListerMouvementsUseCase listerMouvementsUseCase(MouvementFinancierService mouvementFinancierService) {
        return mouvementFinancierService;
    }

    @Bean
    public ListerVersementsApprenantUseCase listerVersementsApprenantUseCase(MouvementFinancierService mouvementFinancierService) {
        return mouvementFinancierService;
    }

    @Bean
    public SaisirEntreeUseCase saisirEntreeUseCase(MouvementFinancierService mouvementFinancierService) {
        return mouvementFinancierService;
    }

    @Bean
    public SaisirSortieUseCase saisirSortieUseCase(MouvementFinancierService mouvementFinancierService) {
        return mouvementFinancierService;
    }

    @Bean
    public ModifierEntreeUseCase modifierEntreeUseCase(MouvementFinancierService mouvementFinancierService) {
        return mouvementFinancierService;
    }

    @Bean
    public SupprimerEntreeUseCase supprimerEntreeUseCase(MouvementFinancierService mouvementFinancierService) {
        return mouvementFinancierService;
    }
}