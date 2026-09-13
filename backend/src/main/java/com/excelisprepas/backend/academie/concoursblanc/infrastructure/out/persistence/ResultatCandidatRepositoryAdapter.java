package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.ResultatCandidat;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ResultatCandidatRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.NoteEpreuve;
import java.util.ArrayList;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class ResultatCandidatRepositoryAdapter implements ResultatCandidatRepositoryPort {

    private final ResultatCandidatJpaRepository resultatJpaRepository;
    private final ConcoursBlancPersistenceMapper mapper;

    @Override
    @Transactional
    public ResultatCandidat save(ResultatCandidat resultat) {
        List<ResultatCandidat> saved = saveAll(List.of(resultat));
        return saved.isEmpty() ? null : saved.get(0);
    }

    @Override
    @Transactional
    public List<ResultatCandidat> saveAll(List<ResultatCandidat> resultats) {
        List<ResultatCandidatEntity> savedEntities = new ArrayList<>();
        for (ResultatCandidat r : resultats) {
            Optional<ResultatCandidatEntity> existingOpt = resultatJpaRepository.findById(r.getId());
            ResultatCandidatEntity entity;
            if (existingOpt.isPresent()) {
                entity = existingOpt.get();
                entity.setFormationId(r.getFormationId());
                entity.setCentreId(r.getCentreId());
                entity.setApprenantId(r.getApprenantId());
                entity.setNomComplet(r.getNomComplet());
                entity.setEtablissementOrigine(r.getEtablissementOrigine());
                entity.setHorsListe(r.isHorsListe());
                entity.setTotalPondere(r.getTotalPondere());
                entity.setMoyennePonderee(r.getMoyennePonderee());
                entity.setRang(r.getRang());
                entity.setRangCentre(r.getRangCentre());
                entity.setDeltaRang(r.getDeltaRang());

                if (r.getNotes() != null) {
                    Map<UUID, NoteEpreuveEntity> existingNotesMap = entity.getNotes().stream()
                            .collect(Collectors.toMap(NoteEpreuveEntity::getEpreuveId, n -> n, (n1, n2) -> n1));

                    List<NoteEpreuveEntity> updatedNotes = new ArrayList<>();
                    for (NoteEpreuve ne : r.getNotes()) {
                        NoteEpreuveEntity noteEntity = existingNotesMap.get(ne.epreuveId());
                        if (noteEntity == null) {
                            noteEntity = new NoteEpreuveEntity();
                            noteEntity.setId(UUID.randomUUID());
                            noteEntity.setResultatCandidat(entity);
                            noteEntity.setEpreuveId(ne.epreuveId());
                        }
                        noteEntity.setNote(ne.note());
                        noteEntity.setStatut(ne.statut());
                        updatedNotes.add(noteEntity);
                    }
                    entity.getNotes().clear();
                    entity.getNotes().addAll(updatedNotes);
                }
            } else {
                entity = mapper.toEntity(r);
            }
            savedEntities.add(resultatJpaRepository.save(entity));
        }
        return savedEntities.stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResultatCandidat> findByConcoursBlancIdAndCentreId(UUID concoursBlancId, UUID centreId) {
        return resultatJpaRepository.findByConcoursBlancIdAndCentreId(concoursBlancId, centreId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResultatCandidat> findByConcoursBlancIdAndFormationId(UUID concoursBlancId, UUID formationId) {
        return resultatJpaRepository.findByConcoursBlancIdAndFormationId(concoursBlancId, formationId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ResultatCandidat> findByConcoursBlancId(UUID concoursBlancId) {
        return resultatJpaRepository.findByConcoursBlancId(concoursBlancId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ResultatCandidat> findByConcoursBlancIdAndApprenantId(UUID concoursBlancId, UUID apprenantId) {
        return resultatJpaRepository.findByConcoursBlancIdAndApprenantId(concoursBlancId, apprenantId)
                .map(mapper::toDomain);
    }

    @Override
    @Transactional
    public void deleteByConcoursBlancId(UUID concoursBlancId) {
        resultatJpaRepository.deleteByConcoursBlancId(concoursBlancId);
    }
}

