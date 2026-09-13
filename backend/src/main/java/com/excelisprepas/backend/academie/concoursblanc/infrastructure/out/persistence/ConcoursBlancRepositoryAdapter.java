package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.ConcoursBlanc;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ConcoursBlancRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class ConcoursBlancRepositoryAdapter implements ConcoursBlancRepositoryPort {

    private final ConcoursBlancJpaRepository concoursBlancJpaRepository;
    private final ConcoursBlancPersistenceMapper mapper;

    @Override
    @Transactional
    public ConcoursBlanc save(ConcoursBlanc concoursBlanc) {
        ConcoursBlancEntity entity;
        if (concoursBlanc.getId() != null) {
            Optional<ConcoursBlancEntity> opt = concoursBlancJpaRepository.findById(concoursBlanc.getId());
            if (opt.isPresent()) {
                entity = opt.get();
                entity.setSessionId(concoursBlanc.getSessionId());
                entity.setTitre(concoursBlanc.getTitre());
                entity.setNumero(concoursBlanc.getNumero());
                entity.setDateEpreuve(concoursBlanc.getDateEpreuve());
                entity.setJour(concoursBlanc.getJour());
                entity.setSemaine(concoursBlanc.getSemaine());
                entity.setStatut(concoursBlanc.getStatut());
                entity.setSeanceDebut(concoursBlanc.getSeanceDebut());
                entity.setSeanceFin(concoursBlanc.getSeanceFin());
                entity.setTousLesCentres(concoursBlanc.isTousLesCentres());
                entity.setCentreIds(concoursBlanc.getCentreIds());
                entity.setSaisieNotesBloqueeCentre(concoursBlanc.isSaisieNotesBloqueeCentre());
                ConcoursBlancEntity saved = concoursBlancJpaRepository.save(entity);
                ConcoursBlanc result = mapper.toDomain(saved);
                if (concoursBlanc.getEpreuves() != null && !concoursBlanc.getEpreuves().isEmpty()) {
                    result.setEpreuves(concoursBlanc.getEpreuves());
                }
                return result;
            }
        }
        entity = mapper.toEntity(concoursBlanc);
        ConcoursBlancEntity saved = concoursBlancJpaRepository.save(entity);
        ConcoursBlanc result = mapper.toDomain(saved);
        if (concoursBlanc.getEpreuves() != null && !concoursBlanc.getEpreuves().isEmpty()) {
            result.setEpreuves(concoursBlanc.getEpreuves());
        }
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ConcoursBlanc> findById(UUID id) {
        return concoursBlancJpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ConcoursBlanc> findBySessionId(UUID sessionId) {
        return concoursBlancJpaRepository.findBySessionIdOrderByDateEpreuveAscNumeroAsc(sessionId)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ConcoursBlanc> findPreviousConcours(UUID sessionId, int currentNumero) {
        return concoursBlancJpaRepository.findPreviousConcours(sessionId, currentNumero).map(mapper::toDomain);
    }

    @Override
    @Transactional
    public void deleteById(UUID id) {
        concoursBlancJpaRepository.deleteById(id);
    }
}

