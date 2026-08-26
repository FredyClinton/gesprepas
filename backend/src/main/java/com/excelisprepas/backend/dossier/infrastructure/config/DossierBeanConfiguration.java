package com.excelisprepas.backend.dossier.infrastructure.config;

import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.dossier.domain.port.out.*;
import com.excelisprepas.backend.dossier.domain.service.ConcoursService;
import com.excelisprepas.backend.dossier.domain.service.DossierFinancierService;
import com.excelisprepas.backend.dossier.domain.service.DossierService;
import com.excelisprepas.backend.dossier.domain.service.PieceRequiseService;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.out.EntreeRepositoryPort;
import com.excelisprepas.backend.session.domain.port.out.SessionAcademiqueRepositoryPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DossierBeanConfiguration {

    @Bean
    public PieceRequiseService pieceRequiseService(PieceRequiseRepositoryPort pieceRequiseRepositoryPort) {
        return new PieceRequiseService(pieceRequiseRepositoryPort);
    }

    @Bean
    public CreerPieceRequiseUseCase creerPieceRequiseUseCase(PieceRequiseService pieceRequiseService) {
        return pieceRequiseService;
    }

    @Bean
    public ModifierPieceRequiseUseCase modifierPieceRequiseUseCase(PieceRequiseService pieceRequiseService) {
        return pieceRequiseService;
    }

    @Bean
    public DesactiverPieceRequiseUseCase desactiverPieceRequiseUseCase(PieceRequiseService pieceRequiseService) {
        return pieceRequiseService;
    }

    @Bean
    public ReactiverPieceRequiseUseCase reactiverPieceRequiseUseCase(PieceRequiseService pieceRequiseService) {
        return pieceRequiseService;
    }

    @Bean
    public ListerPiecesRequisesUseCase listerPieceRequisesUseCase(PieceRequiseService pieceRequiseService) {
        return pieceRequiseService;
    }

    @Bean
    public ConcoursService concoursService(ConcoursRepositoryPort concoursRepository,
                                           ConcoursPieceRequiseRepositoryPort associationRepository,
                                           PieceRequiseRepositoryPort pieceRequiseRepository,
                                           SessionAcademiqueRepositoryPort sessionRepository) {
        return new ConcoursService(concoursRepository, associationRepository, pieceRequiseRepository, sessionRepository);
    }

    @Bean
    public CreerConcoursUseCase creerConcoursUseCase(ConcoursService concoursService) {
        return concoursService;
    }

    @Bean
    public RecupererConcoursUseCase recupererConcoursUseCase(ConcoursService concoursService) {
        return concoursService;
    }

    @Bean
    public ListerConcoursUseCase listerConcoursUseCase(ConcoursService concoursService) {
        return concoursService;
    }

    @Bean
    public AjouterPieceAuConcoursUseCase ajouterPieceAuConcoursUseCase(ConcoursService concoursService) {
        return concoursService;
    }

    @Bean
    public RetirerPieceDuConcoursUseCase retirerPieceDuConcoursUseCase(ConcoursService concoursService) {
        return concoursService;
    }

    @Bean
    public ListerPiecesDuConcoursUseCase listerPiecesDuConcoursUseCase(ConcoursService concoursService) {
        return concoursService;
    }

    @Bean
    public DossierService dossierService(DossierRepositoryPort dossierRepository,
                                         DossierConcoursRepositoryPort dossierConcoursRepository,
                                         PieceDossierRepositoryPort pieceDossierRepository,
                                         ApprenantRepositoryPort apprenantRepository,
                                         ConcoursRepositoryPort concoursRepository,
                                         ConcoursPieceRequiseRepositoryPort concoursPieceRequiseRepository,
                                         PieceRequiseRepositoryPort pieceRequiseRepository) {
        return new DossierService(dossierRepository, dossierConcoursRepository, pieceDossierRepository,
                apprenantRepository, concoursRepository, concoursPieceRequiseRepository, pieceRequiseRepository);
    }

    @Bean
    public OuvrirDossierUseCase ouvrirDossierUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public RecupererDossierUseCase recupererDossierUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public RecupererDossierParApprenantUseCase recupererDossierParApprenantUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public ModifierObservationUseCase modifierObservationUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public AjouterConcoursAuDossierUseCase ajouterConcoursAuDossierUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public AjouterPieceADossierConcoursUseCase ajouterPieceADossierConcoursUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public ListerDossierConcoursUseCase listerDossierConcoursUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public ListerPiecesDossierUseCase listerPiecesDossierUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public ValiderPieceDeposeeUseCase validerPieceDeposeeUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public SignalerDossierCompletUseCase signalerDossierCompletUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public CloturerDossierUseCase cloturerDossierUseCase(DossierService dossierService) {
        return dossierService;
    }

    @Bean
    public DossierFinancierService dossierFinancierService(DossierConcoursRepositoryPort dossierConcoursRepository,
                                                           DossierRepositoryPort dossierRepository,
                                                           ConcoursRepositoryPort concoursRepository,
                                                           SaisirEntreeUseCase saisirEntreeUseCase,
                                                           EntreeRepositoryPort entreeRepository) {
        return new DossierFinancierService(dossierConcoursRepository, dossierRepository, concoursRepository,
                saisirEntreeUseCase, entreeRepository);
    }

    @Bean
    public EnregistrerPaiementDossierUseCase enregistrerPaiementDossierUseCase(DossierFinancierService dossierFinancierService) {
        return dossierFinancierService;
    }

    @Bean
    public ConsulterSoldeDossierConcoursUseCase consulterSoldeDossierConcoursUseCase(DossierFinancierService dossierFinancierService) {
        return dossierFinancierService;
    }

    @Bean
    public ObtenirStatistiquesDossiersUseCase obtenirStatistiquesDossiersUseCase(DossierFinancierService dossierFinancierService) {
        return dossierFinancierService;
    }
}