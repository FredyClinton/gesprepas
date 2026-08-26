package com.excelisprepas.backend.dossier.infrastructure.config;

import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursPieceRequiseRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.ConcoursRepositoryPort;
import com.excelisprepas.backend.dossier.domain.port.out.PieceRequiseRepositoryPort;
import com.excelisprepas.backend.dossier.domain.service.ConcoursService;
import com.excelisprepas.backend.dossier.domain.service.PieceRequiseService;
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
}