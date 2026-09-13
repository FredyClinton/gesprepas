package com.excelisprepas.backend.academie.concoursblanc.infrastructure.config;

import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ConcoursBlancRepositoryPort;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.EpreuveConcoursBlancRepositoryPort;
import com.excelisprepas.backend.academie.concoursblanc.domain.port.out.ResultatCandidatRepositoryPort;
import com.excelisprepas.backend.academie.concoursblanc.domain.service.ConcoursBlancService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ConcoursBlancBeanConfiguration {

    @Bean
    public ConcoursBlancService concoursBlancService(
            ConcoursBlancRepositoryPort concoursBlancRepository,
            EpreuveConcoursBlancRepositoryPort epreuveRepository,
            ResultatCandidatRepositoryPort resultatRepository) {
        return new ConcoursBlancService(concoursBlancRepository, epreuveRepository, resultatRepository);
    }
}

