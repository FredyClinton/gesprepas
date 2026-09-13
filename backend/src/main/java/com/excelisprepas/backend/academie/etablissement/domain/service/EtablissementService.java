package com.excelisprepas.backend.academie.etablissement.domain.service;

import com.excelisprepas.backend.academie.etablissement.domain.model.Etablissement;
import com.excelisprepas.backend.academie.etablissement.domain.port.out.EtablissementRepositoryPort;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
public class EtablissementService {

    private final EtablissementRepositoryPort repository;

    public EtablissementService(EtablissementRepositoryPort repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<Etablissement> listerTous() {
        return repository.findAll();
    }

    @Transactional
    public Etablissement enregistrerOuRecuperer(String nom, String ville) {
        if (nom == null || nom.isBlank()) {
            return null;
        }
        String nomNettoye = nom.trim();
        Optional<Etablissement> existant = repository.findByNomIgnoreCase(nomNettoye);
        if (existant.isPresent()) {
            return existant.get();
        }

        Etablissement nouveau = new Etablissement(UUID.randomUUID(), nomNettoye, ville != null ? ville.trim() : null);
        Etablissement sauvegarde = repository.save(nouveau);
        log.info("Nouvel établissement enregistré au catalogue : id={}, nom='{}', ville='{}'",
                sauvegarde.getId(), sauvegarde.getNom(), sauvegarde.getVille());
        return sauvegarde;
    }
}

