package com.excelisprepas.backend.remuneration.infrastructure.out.persistence;

import com.excelisprepas.backend.remuneration.domain.model.BordereauPaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.model.FichePaiePersonnel;
import com.excelisprepas.backend.remuneration.domain.port.out.BordereauPaiePersonnelRepositoryPort;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Repository
public class BordereauPaiePersonnelRepositoryAdapter implements BordereauPaiePersonnelRepositoryPort {

    private final BordereauPaiePersonnelJpaRepository repository;

    public BordereauPaiePersonnelRepositoryAdapter(BordereauPaiePersonnelJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public BordereauPaiePersonnel save(BordereauPaiePersonnel bordereau) {
        BordereauPaiePersonnelEntity entity = new BordereauPaiePersonnelEntity();
        entity.setId(bordereau.getId());
        entity.setSessionId(bordereau.getSessionId());
        entity.setReference(bordereau.getReference());
        entity.setIntitule(bordereau.getIntitule());
        entity.setDatePaiement(bordereau.getDatePaiement());
        entity.setNombrePersonnelsPayes(bordereau.getNombrePersonnelsPayes());
        entity.setMontantTotalGlobal(bordereau.getMontantTotalGlobal());
        entity.setSortieId(bordereau.getSortieId());
        entity.setSaisiPar(bordereau.getSaisiPar());

        List<FichePaiePersonnelEntity> fiches = bordereau.getFiches().stream().map(f -> {
            FichePaiePersonnelEntity fEntity = new FichePaiePersonnelEntity();
            fEntity.setId(f.getId());
            fEntity.setBordereauPaiePersonnel(entity);
            fEntity.setPersonnelId(f.getPersonnelId());
            fEntity.setSalaireReference(f.getSalaireReference());
            fEntity.setMontantPaye(f.getMontantPaye());
            fEntity.setObservations(f.getObservations());
            return fEntity;
        }).collect(Collectors.toList());

        entity.setFiches(fiches);
        return mapToDomain(repository.save(entity));
    }

    @Override
    public Optional<BordereauPaiePersonnel> findById(UUID id) {
        return repository.findById(id).map(this::mapToDomain);
    }

    @Override
    public List<BordereauPaiePersonnel> findBySessionId(UUID sessionId) {
        return repository.findBySessionId(sessionId).stream().map(this::mapToDomain).collect(Collectors.toList());
    }

    private BordereauPaiePersonnel mapToDomain(BordereauPaiePersonnelEntity entity) {
        List<FichePaiePersonnel> fiches = new ArrayList<>();
        if (entity.getFiches() != null) {
            for (FichePaiePersonnelEntity f : entity.getFiches()) {
                fiches.add(new FichePaiePersonnel(
                        f.getId(), entity.getId(), f.getPersonnelId(),
                        f.getSalaireReference(), f.getMontantPaye(), f.getObservations()));
            }
        }
        return BordereauPaiePersonnel.reconstituer(
                entity.getId(), entity.getSessionId(), entity.getReference(), entity.getIntitule(),
                entity.getDatePaiement(), fiches, entity.getNombrePersonnelsPayes(),
                entity.getMontantTotalGlobal(), entity.getSortieId(), entity.getSaisiPar()
        );
    }
}
