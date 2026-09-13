package com.excelisprepas.backend.livre.domain.service;

import com.excelisprepas.backend.livre.domain.model.Livre;
import com.excelisprepas.backend.livre.domain.port.in.CreerLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.in.ListerLivresUseCase;
import com.excelisprepas.backend.livre.domain.port.in.ModifierLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.in.SupprimerLivreUseCase;
import com.excelisprepas.backend.livre.domain.port.out.LivreRepositoryPort;
import com.excelisprepas.backend.shared.exception.LivreIntrouvableException;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class LivreService implements ListerLivresUseCase, CreerLivreUseCase, ModifierLivreUseCase, SupprimerLivreUseCase {

    private final LivreRepositoryPort livreRepositoryPort;

    public LivreService(LivreRepositoryPort livreRepositoryPort) {
        this.livreRepositoryPort = livreRepositoryPort;
    }

    @Override
    public List<Livre> listerTous() {
        return livreRepositoryPort.findAll();
    }

    @Override
    public List<Livre> listerActifs() {
        return livreRepositoryPort.findByActifTrue();
    }

    @Override
    public Livre creerLivre(String titre, String description, BigDecimal prix) {
        Livre livre = Livre.nouveau(titre, description, prix);
        return livreRepositoryPort.save(livre);
    }

    @Override
    public Livre modifierLivre(UUID id, String titre, String description, BigDecimal prix, boolean actif) {
        Livre livre = livreRepositoryPort.findById(id)
                .orElseThrow(() -> new LivreIntrouvableException(id));
        livre.modifier(titre, description, prix, actif);
        return livreRepositoryPort.save(livre);
    }

    @Override
    public void supprimerLivre(UUID id) {
        if (livreRepositoryPort.findById(id).isEmpty()) {
            throw new LivreIntrouvableException(id);
        }
        livreRepositoryPort.deleteById(id);
    }
}

