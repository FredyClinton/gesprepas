package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.*;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
public class ConcoursBlancPersistenceMapper {

    public ConcoursBlanc toDomain(ConcoursBlancEntity entity) {
        if (entity == null) return null;
        ConcoursBlanc domain = new ConcoursBlanc(
                entity.getId(),
                entity.getSessionId(),
                entity.getTitre(),
                entity.getNumero(),
                entity.getDateEpreuve(),
                entity.getJour(),
                entity.getSemaine(),
                entity.getStatut(),
                entity.getSeanceDebut(),
                entity.getSeanceFin(),
                entity.isTousLesCentres(),
                entity.getCentreIds(),
                entity.isSaisieNotesBloqueeCentre()
        );
        if (entity.getEpreuves() != null) {
            domain.setEpreuves(entity.getEpreuves().stream()
                    .map(this::toDomain)
                    .collect(Collectors.toList()));
        }
        return domain;
    }

    public ConcoursBlancEntity toEntity(ConcoursBlanc domain) {
        if (domain == null) return null;
        ConcoursBlancEntity entity = new ConcoursBlancEntity();
        entity.setId(domain.getId());
        entity.setSessionId(domain.getSessionId());
        entity.setTitre(domain.getTitre());
        entity.setNumero(domain.getNumero());
        entity.setDateEpreuve(domain.getDateEpreuve());
        entity.setJour(domain.getJour());
        entity.setSemaine(domain.getSemaine());
        entity.setStatut(domain.getStatut());
        entity.setSeanceDebut(domain.getSeanceDebut());
        entity.setSeanceFin(domain.getSeanceFin());
        entity.setTousLesCentres(domain.isTousLesCentres());
        entity.setCentreIds(domain.getCentreIds());
        entity.setSaisieNotesBloqueeCentre(domain.isSaisieNotesBloqueeCentre());
        if (entity.getDateCreation() == null) {
            entity.setDateCreation(OffsetDateTime.now());
        }
        return entity;
    }

    public EpreuveConcoursBlanc toDomain(EpreuveConcoursBlancEntity entity) {
        if (entity == null) return null;
        return new EpreuveConcoursBlanc(
                entity.getId(),
                entity.getConcoursBlanc() != null ? entity.getConcoursBlanc().getId() : null,
                entity.getFormationId(),
                entity.getMatiereId(),
                entity.getIntitule(),
                entity.getDureeMinutes(),
                entity.getNoteMax(),
                entity.getCoefficient(),
                entity.getContenuEvaluation(),
                entity.getConsignes()
        );
    }

    public EpreuveConcoursBlancEntity toEntity(EpreuveConcoursBlanc domain, ConcoursBlancEntity parent) {
        if (domain == null) return null;
        EpreuveConcoursBlancEntity entity = new EpreuveConcoursBlancEntity();
        entity.setId(domain.getId());
        entity.setConcoursBlanc(parent);
        entity.setFormationId(domain.getFormationId());
        entity.setMatiereId(domain.getMatiereId());
        entity.setIntitule(domain.getIntitule());
        entity.setDureeMinutes(domain.getDureeMinutes());
        entity.setNoteMax(domain.getNoteMax());
        entity.setCoefficient(domain.getCoefficient());
        entity.setContenuEvaluation(domain.getContenuEvaluation());
        entity.setConsignes(domain.getConsignes());
        if (entity.getDateCreation() == null) {
            entity.setDateCreation(OffsetDateTime.now());
        }
        return entity;
    }

    public ResultatCandidat toDomain(ResultatCandidatEntity entity) {
        if (entity == null) return null;
        List<NoteEpreuve> notes = new ArrayList<>();
        if (entity.getNotes() != null) {
            notes = entity.getNotes().stream()
                    .map(n -> new NoteEpreuve(n.getEpreuveId(), n.getNote(), n.getStatut()))
                    .collect(Collectors.toList());
        }
        ResultatCandidat domain = new ResultatCandidat(
                entity.getId(),
                entity.getConcoursBlancId(),
                entity.getFormationId(),
                entity.getCentreId(),
                entity.getApprenantId(),
                entity.getNomComplet(),
                entity.getEtablissementOrigine(),
                entity.isHorsListe(),
                notes
        );
        domain.setTotalPondere(entity.getTotalPondere());
        domain.setMoyennePonderee(entity.getMoyennePonderee());
        domain.setRang(entity.getRang());
        domain.setRangCentre(entity.getRangCentre());
        domain.setDeltaRang(entity.getDeltaRang());
        return domain;
    }

    public ResultatCandidatEntity toEntity(ResultatCandidat domain) {
        if (domain == null) return null;
        ResultatCandidatEntity entity = new ResultatCandidatEntity();
        entity.setId(domain.getId());
        entity.setConcoursBlancId(domain.getConcoursBlancId());
        entity.setFormationId(domain.getFormationId());
        entity.setCentreId(domain.getCentreId());
        entity.setApprenantId(domain.getApprenantId());
        entity.setNomComplet(domain.getNomComplet());
        entity.setEtablissementOrigine(domain.getEtablissementOrigine());
        entity.setHorsListe(domain.isHorsListe());
        entity.setTotalPondere(domain.getTotalPondere());
        entity.setMoyennePonderee(domain.getMoyennePonderee());
        entity.setRang(domain.getRang());
        entity.setRangCentre(domain.getRangCentre());
        entity.setDeltaRang(domain.getDeltaRang());

        if (domain.getNotes() != null) {
            List<NoteEpreuveEntity> noteEntities = domain.getNotes().stream().map(n -> {
                NoteEpreuveEntity ne = new NoteEpreuveEntity();
                ne.setId(UUID.randomUUID());
                ne.setResultatCandidat(entity);
                ne.setEpreuveId(n.epreuveId());
                ne.setNote(n.note());
                ne.setStatut(n.statut());
                return ne;
            }).collect(Collectors.toList());
            entity.setNotes(noteEntities);
        }
        return entity;
    }
}

