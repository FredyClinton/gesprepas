package com.excelisprepas.backend.academie.concoursblanc.infrastructure.out.persistence;

import com.excelisprepas.backend.academie.concoursblanc.domain.model.EpreuveConcoursBlanc;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.EpreuveConcoursBlancRepositoryPort;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class EpreuveConcoursBlancRepositoryAdapter implements EpreuveConcoursBlancRepositoryPort {

    private final ConcoursBlancJpaRepository concoursBlancJpaRepository;
    private final EpreuveConcoursBlancJpaRepository epreuveJpaRepository;
    private final ConcoursBlancPersistenceMapper mapper;

    @Override
    @Transactional
    public EpreuveConcoursBlanc save(EpreuveConcoursBlanc epreuve) {
        ConcoursBlancEntity parent = concoursBlancJpaRepository.findById(epreuve.getConcoursBlancId())
                .orElseThrow(() -> new IllegalArgumentException("Concours blanc non trouvé: " + epreuve.getConcoursBlancId()));
        EpreuveConcoursBlancEntity entity = mapper.toEntity(epreuve, parent);
        EpreuveConcoursBlancEntity saved = epreuveJpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public List<EpreuveConcoursBlanc> saveAll(List<EpreuveConcoursBlanc> epreuves) {
        if (epreuves.isEmpty()) return List.of();
        UUID cbId = epreuves.getFirst().getConcoursBlancId();
        ConcoursBlancEntity parent = concoursBlancJpaRepository.findById(cbId)
                .orElseThrow(() -> new IllegalArgumentException("Concours blanc non trouvé: " + cbId));
        List<EpreuveConcoursBlancEntity> entities = epreuves.stream()
                .map(e -> mapper.toEntity(e, parent))
                .collect(Collectors.toList());
        return epreuveJpaRepository.saveAll(entities).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EpreuveConcoursBlanc> findByConcoursBlancId(UUID concoursBlancId) {
        return epreuveJpaRepository.findByConcoursBlancId(concoursBlancId).stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EpreuveConcoursBlanc> findById(UUID id) {
        return epreuveJpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    @Transactional
    public void deleteByConcoursBlancId(UUID concoursBlancId) {
        epreuveJpaRepository.deleteByConcoursBlancId(concoursBlancId);
    }
}

