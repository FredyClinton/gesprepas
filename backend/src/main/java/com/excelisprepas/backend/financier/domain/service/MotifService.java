package com.excelisprepas.backend.financier.domain.service;

import com.excelisprepas.backend.financier.domain.model.Motif;
import com.excelisprepas.backend.financier.domain.model.TypeMotif;
import com.excelisprepas.backend.financier.domain.port.in.*;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.shared.exception.MotifIntrouvableException;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.UUID;

@Slf4j
public class MotifService implements CreerMotifUseCase, ModifierMotifUseCase,
        DesactiverMotifUseCase, ReactiverMotifUseCase, ListerMotifsUseCase {

    private final MotifRepositoryPort repository;

    public MotifService(MotifRepositoryPort repository) {
        this.repository = repository;
    }

    @Override
    public Motif creerMotif(String nom, TypeMotif type) {
        Motif motif = new Motif(UUID.randomUUID(), nom, type);
        motif = repository.save(motif);
        log.info("Motif créé : id={}, nom={}, type={}", motif.getId(), nom, type);
        return motif;
    }

    @Override
    public Motif modifierMotif(UUID id, String nouveauNom) {
        Motif motif = recuperer(id);
        motif.renommer(nouveauNom);
        motif = repository.save(motif);
        log.info("Motif modifié : id={}, nouveauNom={}", id, nouveauNom);
        return motif;
    }

    @Override
    public Motif desactiverMotif(UUID id) {
        Motif motif = recuperer(id);
        motif.desactiver();
        motif = repository.save(motif);
        log.info("Motif désactivé : id={}", id);
        return motif;
    }

    @Override
    public Motif reactiverMotif(UUID id) {
        Motif motif = recuperer(id);
        motif.reactiver();
        motif = repository.save(motif);
        log.info("Motif réactivé : id={}", id);
        return motif;
    }

    @Override
    public List<Motif> listerMotifs(TypeMotif typeOuNull) {
        if (typeOuNull == null) {
            return repository.findAll();
        }
        return repository.findAll().stream()
                .filter(motif -> motif.getType() == typeOuNull)
                .toList();
    }

    private Motif recuperer(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new MotifIntrouvableException(id));
    }
}