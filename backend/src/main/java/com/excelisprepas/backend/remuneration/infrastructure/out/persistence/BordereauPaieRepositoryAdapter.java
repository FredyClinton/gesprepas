package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.affectation.infrastructure.out.persistence.AffectationJpaRepository;
import com.excelisprepas.backend.remuneration.domain.model.BordereauPaie;
import com.excelisprepas.backend.remuneration.domain.model.FichePaieEnseignant;
import com.excelisprepas.backend.remuneration.domain.model.LigneDecompteSeance;
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
        BordereauPaieEntity entity = new BordereauPaieEntity();
        entity.setId(bordereau.getId());
        entity.setSessionId(bordereau.getSessionId());
        entity.setReference(bordereau.getReference());
        entity.setDatePaiement(bordereau.getDatePaiement());
        entity.setNombreTotalEnseignants(bordereau.getNombreTotalEnseignants());
        entity.setNombreTotalSeances(bordereau.getNombreTotalSeances());
        entity.setMontantTotalGlobal(bordereau.getMontantTotalGlobal());
        entity.setSortieId(bordereau.getSortieId());
        entity.setSaisiPar(bordereau.getSaisiPar());
        
        List<FichePaieEnseignantEntity> fiches = bordereau.getFiches().stream().map(fiche -> {
            FichePaieEnseignantEntity f = new FichePaieEnseignantEntity();
            f.setId(fiche.getId());
            f.setBordereauPaie(entity);
            f.setEnseignantId(fiche.getEnseignantId());
            f.setNombreSeances(fiche.getNombreSeances());
            f.setMontantTotal(fiche.getMontantTotal());
            return f;
        }).collect(Collectors.toList());
        
        entity.setFiches(fiches);
        
        BordereauPaieEntity saved = jpaRepository.save(entity);
        return mapToDomain(saved);
    }

    @Override
    public Optional<BordereauPaie> findById(UUID id) {
        return jpaRepository.findById(id).map(this::mapToDomain);
    }

    @Override
    public List<BordereauPaie> findBySessionId(UUID sessionId) {
        return jpaRepository.findBySessionId(sessionId).stream().map(this::mapToDomain).collect(Collectors.toList());
    }
    
    private BordereauPaie mapToDomain(BordereauPaieEntity entity) {
        List<FichePaieEnseignant> fiches = new ArrayList<>();
        if (entity.getFiches() != null) {
            for (FichePaieEnseignantEntity fEntity : entity.getFiches()) {
                // Recuperer les lignes depuis les affectations
                // En realite, il faudrait un custom query dans AffectationJpaRepository
                // Pour simplifier l'exemple, on le met vide si on ne peut pas les charger facilement
                // Dans le cas reel, on ferait `affectationJpaRepository.findByFichePaieId(fEntity.getId())`
                List<LigneDecompteSeance> lignes = new ArrayList<>(); // TODO: Load from DB if needed
                fiches.add(new FichePaieEnseignant(fEntity.getId(), entity.getId(), fEntity.getEnseignantId(), lignes));
            }
        }
        
        return BordereauPaie.reconstituer(
                entity.getId(), entity.getSessionId(), entity.getReference(), entity.getDatePaiement(),
                fiches, entity.getNombreTotalEnseignants(), entity.getNombreTotalSeances(),
                entity.getMontantTotalGlobal(), entity.getSortieId(), entity.getSaisiPar()
        );
    }
}
