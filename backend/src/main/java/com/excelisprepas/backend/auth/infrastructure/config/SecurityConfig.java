package com.excelisprepas.backend.auth.infrastructure.config;

import com.excelisprepas.backend.auth.domain.port.out.TokenPort;
import com.excelisprepas.backend.auth.infrastructure.in.web.JwtAuthenticationFilter;
import com.excelisprepas.backend.shared.infrastructure.in.web.dto.ApiErrorResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;

/**
 * API stateless protégée par JWT : pas de session HTTP, pas de CSRF (aucun
 * cookie de session à protéger), CORS délégué à shared/config/CorsConfig
 * (déjà en place - .cors(Customizer.withDefaults()) le réutilise via
 * l'introspecteur Spring MVC, pas besoin de le redéfinir ici).
 *
 * Tout est authentifié par défaut ; seules /api/auth/** (login/refresh) et
 * Swagger restent publiques. @EnableMethodSecurity active @PreAuthorize
 * pour le bloc 8 (permissions par endpoint).
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private static final String[] ROUTES_PUBLIQUES = {
            "/api/auth/**",
            "/swagger-ui/**",
            "/swagger-ui.html",
            "/v3/api-docs/**"
    };

    // Instance dédiée, pas le bean ObjectMapper de l'appli (spring-boot-starter-webmvc,
    // contrairement à l'ancien spring-boot-starter-web, n'en enregistre pas un par
    // défaut) - juste pour sérialiser ApiErrorResponse, pas besoin de la config Jackson
    // globale de l'appli ici.
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, TokenPort tokenPort) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(ROUTES_PUBLIQUES).permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) ->
                                ecrireErreur(response, HttpStatus.UNAUTHORIZED, "Authentification requise"))
                        .accessDeniedHandler((request, response, accessDeniedException) ->
                                ecrireErreur(response, HttpStatus.FORBIDDEN, "Accès refusé")))
                .addFilterBefore(new JwtAuthenticationFilter(tokenPort), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    private static void ecrireErreur(HttpServletResponse response, HttpStatus statut, String message) throws IOException {
        response.setStatus(statut.value());
        response.setCharacterEncoding("UTF-8");
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(OBJECT_MAPPER.writeValueAsString(
                new ApiErrorResponse(statut.value(), statut.getReasonPhrase(), message)));
    }
}
