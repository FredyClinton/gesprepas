package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.auth.domain.model.MatricePermissions;
import com.excelisprepas.backend.auth.domain.port.out.TokenPort;
import com.excelisprepas.backend.shared.exception.TokenInvalideException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.List;

/**
 * Lit le header Authorization de chaque requête, valide le JWT s'il est
 * présent, et place l'utilisateur authentifié dans le SecurityContext avec
 * ses permissions (déduites de son rôle global via MatricePermissions -
 * celles issues d'AttributionRole centre-scopées sont vérifiées plus tard,
 * à la demande, par ContexteUtilisateurPort - bloc 7).
 *
 * Absence de header ou token invalide -> on laisse la requête continuer sans
 * authentification : c'est SecurityConfig (authorizeHttpRequests) qui décide
 * ensuite si la route exige d'être authentifié, pas ce filtre.
 *
 * PAS de @Component ici volontairement : un bean Filter auto-détecté serait
 * aussi enregistré par Spring Boot comme filtre servlet générique (en plus
 * de son inclusion dans la chaîne Spring Security via addFilterBefore dans
 * SecurityConfig), ce qui le fait tourner deux fois, à deux endroits
 * différents de la chaîne - avec des effets de bord difficiles à diagnostiquer
 * (le SecurityContext posé par la copie "en double" arrive après la
 * vérification d'autorisation). Il est donc instancié manuellement comme
 * @Bean dans SecurityConfig, jamais component-scanné.
 */
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final String PREFIXE_BEARER = "Bearer ";

    private final TokenPort tokenPort;

    public JwtAuthenticationFilter(TokenPort tokenPort) {
        this.tokenPort = tokenPort;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String enTete = request.getHeader("Authorization");

        if (enTete != null && enTete.startsWith(PREFIXE_BEARER)) {
            try {
                ClaimsAccessToken claims = tokenPort.validerAccessToken(enTete.substring(PREFIXE_BEARER.length()));

                List<GrantedAuthority> autorites = MatricePermissions.permissionsDe(claims.role()).stream()
                        .map(permission -> (GrantedAuthority) new SimpleGrantedAuthority(permission.name()))
                        .toList();

                var authentication = new UsernamePasswordAuthenticationToken(claims, null, autorites);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                log.debug("Authentifié via JWT : utilisateurId={}", claims.utilisateurId());
            } catch (TokenInvalideException e) {
                log.debug("Authentification JWT refusée : {}", e.getMessage());
                SecurityContextHolder.clearContext();
            }
        }

        filterChain.doFilter(request, response);
    }
}
