package com.excelisprepas.backend.dossier.domain.service;

import com.excelisprepas.backend.dossier.domain.model.PieceRequise;
import com.excelisprepas.backend.dossier.domain.port.in.*;
import com.excelisprepas.backend.dossier.domain.port.out.PieceRequiseRepositoryPort;
import com.excelisprepas.backend.shared.exception.PieceRequiseIntrouvableException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class PieceRequiseService implements CreerPieceRequiseUseCase, ModifierPieceRequiseUseCase,
        DesactiverPieceRequiseUseCase, ReactiverPieceRequiseUseCase, ListerPiecesRequisesUseCase {

    private final PieceRequiseRepositoryPort pieceRequiseRepositoryPort;

    public PieceRequiseService(PieceRequiseRepositoryPort pieceRequiseRepositoryPort) {
        this.pieceRequiseRepositoryPort = pieceRequiseRepositoryPort;
    }


    @Override
    public PieceRequise creerPieceRequise(String nom, BigDecimal montant) {
        PieceRequise pieceRequise = new PieceRequise(UUID.randomUUID(), nom, montant);
        return pieceRequiseRepositoryPort.save(pieceRequise);
    }

    @Override
    public PieceRequise desactiverPieceRequise(UUID id) {
        PieceRequise pieceRequise = recuperer(id);
        pieceRequise.desactiver();
        return pieceRequiseRepositoryPort.save(pieceRequise);
    }


    @Override
    public PieceRequise modifierPieceRequise(UUID id, String nom, BigDecimal montant) {
        PieceRequise pieceRequise = recuperer(id);
        pieceRequise.modifier(nom, montant);
        return pieceRequiseRepositoryPort.save(pieceRequise);
    }

    @Override
    public PieceRequise reactiverPieceRequise(UUID id) {
        PieceRequise pieceRequise = recuperer(id);
        pieceRequise.reactiver();
        return pieceRequiseRepositoryPort.save(pieceRequise);
    }

    private PieceRequise recuperer(UUID id) {
        return pieceRequiseRepositoryPort.findById(id)
                .orElseThrow(() -> new PieceRequiseIntrouvableException(id));
    }


    @Override
    public List<PieceRequise> listerPiecesRequises() {
        return pieceRequiseRepositoryPort.findAll();
    }
}
