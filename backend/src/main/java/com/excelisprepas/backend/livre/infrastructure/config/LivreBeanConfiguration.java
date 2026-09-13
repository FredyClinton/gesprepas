package com.excelisprepas.backend.livre.infrastructure.config;

import com.excelisprepas.backend.apprenant.domain.port.out.ApprenantRepositoryPort;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.financier.domain.port.in.SaisirEntreeUseCase;
import com.excelisprepas.backend.financier.domain.port.out.MotifRepositoryPort;
import com.excelisprepas.backend.livre.domain.port.out.LivreRepositoryPort;
import com.excelisprepas.backend.livre.domain.port.out.VenteLivreRepositoryPort;
import com.excelisprepas.backend.livre.domain.service.LivreService;
import com.excelisprepas.backend.livre.domain.service.VenteLivreService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class LivreBeanConfiguration {

    @Bean
    public LivreService livreService(LivreRepositoryPort livreRepositoryPort) {
        return new LivreService(livreRepositoryPort);
    }

    @Bean
    public VenteLivreService venteLivreService(VenteLivreRepositoryPort venteLivreRepositoryPort,
                                               LivreRepositoryPort livreRepositoryPort,
                                               SaisirEntreeUseCase saisirEntreeUseCase,
                                               MotifRepositoryPort motifRepositoryPort,
                                               CentreRepositoryPort centreRepositoryPort,
                                               ApprenantRepositoryPort apprenantRepositoryPort) {
        return new VenteLivreService(venteLivreRepositoryPort, livreRepositoryPort,
                saisirEntreeUseCase, motifRepositoryPort, centreRepositoryPort, apprenantRepositoryPort);
    }
}

