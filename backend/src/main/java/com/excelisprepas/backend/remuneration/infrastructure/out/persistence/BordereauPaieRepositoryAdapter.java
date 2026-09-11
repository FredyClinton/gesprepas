package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.affectation.infrastructure.out.persistence.AffectationEntity;
import com.excelisprepas.backend.academie.affectation.infrastructure.out.persistence.AffectationJpaRepository;
import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;
import com.excelisprepas.backend.remuneration.domain.model.FichePaieEnseignant;
import com.excelisprepas.backend.remuneration.domain.model.LigneDecompteSeance;
import com.excelisprepas.backend.remuneration.domain.model.TypeLigneDecompte;
import com.excelisprepas.backend.remuneration.domain.port.out.BordereauPaieRepositoryPort;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class BordereauPaieRepositoryAdapter implements BordereauPaieRepositoryPort {

    private final BordereauPaieJpaRepository jpaRepository;
    private final AffectationJpaRepository affectationJpaRepository;

    public BordereauPaieRepositoryAdapter(BordereauPaieJpaRepository jpaRepository, AffectationJpaRepository affectationJpaRepository) {
        this.jpaRepository = jpaRepository;
        this.affectationJpaRepository = affectationJpaRepository;
    }

    @Override
    public BordereauPaie save(BordereauPaie bordereau) {
        BordereauPaieEntity entity = jpaRepository.findById(bordereau.getId())
                .orElseGet(BordereauPaieEntity::new);

        entity.setId(bordereau.getId());
        entity.setSessionId(bordereau.getSessionId());
        entity.setReference(bordereau.getReference());
        entity.setDatePaiement(bordereau.getDatePaiement());
        entity.setNombreTotalEnseignants(bordereau.getNombreTotalEnseignants());
        entity.setNombreTotalSeances(bordereau.getNombreTotalSeances());
        entity.setMontantTotalGlobal(bordereau.getMontantTotalGlobal());
        entity.setSortieId(bordereau.getSortieId());
        entity.setSaisiPar(bordereau.getSaisiPar());

        if (entity.getFiches() == null) {
            entity.setFiches(new ArrayList<>());
        }

        java.util.Map<UUID, FichePaieEnseignantEntity> existingFiches = entity.getFiches().stream()
                .collect(Collectors.toMap(FichePaieEnseignantEntity::getId, f -> f));

        List<FichePaieEnseignantEntity> fiches = new ArrayList<>();
        for (FichePaieEnseignant fiche : bordereau.getFiches()) {
            FichePaieEnseignantEntity f = existingFiches.getOrDefault(fiche.getId(), new FichePaieEnseignantEntity());
            f.setId(fiche.getId());
            f.setBordereauPaie(entity);
            f.setEnseignantId(fiche.getEnseignantId());
            f.setNombreSeances(fiche.getNombreSeances());
            f.setMontantTotal(fiche.getMontantTotal());
            f.setStatut(fiche.getStatut());
            fiches.add(f);
        }

        entity.getFiches().clear();
        entity.getFiches().addAll(fiches);

        BordereauPaieEntity saved = jpaRepository.saveAndFlush(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<BordereauPaie> findById(UUID id) {
        return jpaRepository.findById(id).map(this::mapToDomain);
    }

    @Override
    public Optional<BordereauPaie> findByReference(String reference) {
        return jpaRepository.findByReference(reference).map(this::mapToDomain);
    }

    @Override
    public List<BordereauPaie> findBySessionId(UUID sessionId) {
        return jpaRepository.findBySessionId(sessionId).stream().map(this::mapToDomain).collect(Collectors.toList());
    }
    
    private BordereauPaie mapToDomain(BordereauPaieEntity entity) {
        List<FichePaieEnseignant> fiches = new ArrayList<>();
        if (entity.getFiches() != null) {
            for (FichePaieEnseignantEntity fEntity : entity.getFiches()) {
                List<LigneDecompteSeance> lignes = new ArrayList<>();
                if (affectationJpaRepository != null) {
                    List<AffectationEntity> affs = affectationJpaRepository.findByFichePaieId(fEntity.getId());
                    for (AffectationEntity a : affs) {
                        lignes.add(new LigneDecompteSeance(
                                a.getId(), a.getSemaine(), a.getJour(),
                                a.getCoutApplique() != null ? a.getCoutApplique() : java.math.BigDecimal.ZERO,
                                TypeLigneDecompte.NORMALE));
                    }
                }
                fiches.add(FichePaieEnseignant.reconstituer(
                        fEntity.getId(), entity.getId(), fEntity.getEnseignantId(),
                        lignes, fEntity.getNombreSeances(), fEntity.getMontantTotal(), fEntity.getStatut()));
            }
        }
        
        return BordereauPaie.reconstituer(
                entity.getId(), entity.getSessionId(), entity.getReference(), entity.getDatePaiement(),
                fiches, entity.getNombreTotalEnseignants(), entity.getNombreTotalSeances(),
                entity.getMontantTotalGlobal(), entity.getSortieId(), entity.getSaisiPar()
        );
    }
}
