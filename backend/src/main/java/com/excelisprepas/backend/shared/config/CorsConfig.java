package com.excelisprepas.backend.shared.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    // Origine(s) du frontend Next.js, séparées par des virgules. En dev :
    // http://localhost:3000 par défaut. En production, surchargé via la variable
    // d'environnement FRONTEND_URL (même convention que DB_HOST/DB_PORT dans
    // application.yaml). Plusieurs valeurs permettent par exemple de tester
    // depuis un mobile sur le même réseau (ex: FRONTEND_URL=http://localhost:3000,
    // http://192.168.1.10:3000) en plus de l'accès localhost habituel.
    @Value("${FRONTEND_URL:http://localhost:3000}")
    private String frontendUrl;

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        String[] origines = frontendUrl.split(",");
        for (int i = 0; i < origines.length; i++) {
            origines[i] = origines[i].trim();
        }

        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins(origines)
                        .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }

        };
    }
}