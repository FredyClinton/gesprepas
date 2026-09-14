package com.excelisprepas.backend.shared.testsupport;

import com.excelisprepas.backend.auth.domain.port.out.TokenPort;
import org.mockito.Mockito;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Fournit un TokenPort mocké aux tests de contrôleurs (@WebMvcTest).
 *
 * Spring Boot inclut automatiquement SecurityConfig dans le contexte de ces
 * slices (pour permettre de tester la sécurité avec @WithMockUser), et le
 * bean filterChain() de SecurityConfig a besoin d'un JwtAuthenticationFilter
 * réel pour être construit, donc d'un TokenPort - même quand
 * @AutoConfigureMockMvc(addFilters = false) désactive les filtres à
 * l'exécution des requêtes. Ce mock satisfait cette dépendance de câblage
 * sans qu'aucun test de contrôleur n'ait à s'en soucier individuellement.
 */
@Configuration
public class TokenPortTestConfig {

    @Bean
    public TokenPort tokenPort() {
        return Mockito.mock(TokenPort.class);
    }
}
