package com.excelisprepas.backend.auth.infrastructure.in.web;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;
import java.util.function.Supplier;

/**
 * Remplace les en-têtes d'identité envoyés par le client ({@code X-User-Role},
 * {@code X-Centre-Id}, {@code X-Departement-Id}) par les valeurs du jeton d'accès.
 *
 * <p>Plusieurs contrôleurs (concours blancs, livres, enseignants, affectations
 * départementales) décident des droits et du centre à partir de ces en-têtes. Tels
 * quels, n'importe quel client pouvait s'y déclarer DIRECTEUR ou se rattacher à un
 * autre centre. Après ce filtre, ils reflètent toujours l'utilisateur authentifié
 * (et sont absents sans authentification), quel que soit ce que le client envoie.
 *
 * <p>Comme {@link JwtAuthenticationFilter}, volontairement sans {@code @Component} :
 * instancié dans {@code SecurityConfig}, sinon Spring Boot l'enregistrerait une
 * seconde fois comme filtre servlet, hors de la chaîne de sécurité.
 */
public class EnTetesIdentiteFilter extends OncePerRequestFilter {

    static final String ROLE = "X-User-Role";
    static final String CENTRE = "X-Centre-Id";
    static final String DEPARTEMENT = "X-Departement-Id";

    /**
     * Centre effectif d'un rôle rattaché à un centre : celui de son rattachement pour la
     * session active (relu en base), pas celui du compte figé dans le jeton à la connexion.
     */
    private final java.util.function.Function<ClaimsAccessToken, UUID> centreRattache;

    /** Centre du jeton tel quel (tests unitaires du filtre). */
    public EnTetesIdentiteFilter() {
        this(ClaimsAccessToken::centreId);
    }

    public EnTetesIdentiteFilter(java.util.function.Function<ClaimsAccessToken, UUID> centreRattache) {
        this.centreRattache = centreRattache;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Map<String, Supplier<String>> valeurs = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        valeurs.put(ROLE, () -> null);
        valeurs.put(CENTRE, () -> null);
        valeurs.put(DEPARTEMENT, () -> null);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof ClaimsAccessToken claims) {
            String role = claims.role() != null ? claims.role().name() : null;
            valeurs.put(ROLE, () -> role);
            valeurs.put(CENTRE, memoriser(() -> {
                // Rôle rattaché à un centre : centre relu en base, et seulement si un
                // contrôleur lit l'en-tête (pas de requête pour les autres endpoints).
                UUID centre = claims.role() != null && claims.role().estCentreScope()
                        ? centreRattache.apply(claims)
                        : claims.centreId();
                return centre != null ? centre.toString() : null;
            }));
            String departement = claims.departementId() != null ? claims.departementId().toString() : null;
            valeurs.put(DEPARTEMENT, () -> departement);
        }
        chain.doFilter(new RequeteIdentiteDuJeton(request, valeurs), response);
    }

    private static Supplier<String> memoriser(Supplier<String> calcul) {
        return new Supplier<>() {
            private boolean calcule;
            private String valeur;

            @Override
            public String get() {
                if (!calcule) {
                    valeur = calcul.get();
                    calcule = true;
                }
                return valeur;
            }
        };
    }

    private static final class RequeteIdentiteDuJeton extends HttpServletRequestWrapper {
        private final Map<String, Supplier<String>> valeurs;

        RequeteIdentiteDuJeton(HttpServletRequest request, Map<String, Supplier<String>> valeurs) {
            super(request);
            this.valeurs = valeurs;
        }

        @Override
        public String getHeader(String name) {
            return valeurs.containsKey(name) ? valeurs.get(name).get() : super.getHeader(name);
        }

        @Override
        public Enumeration<String> getHeaders(String name) {
            if (!valeurs.containsKey(name)) {
                return super.getHeaders(name);
            }
            String valeur = valeurs.get(name).get();
            return Collections.enumeration(valeur == null ? List.of() : List.of(valeur));
        }

        @Override
        public Enumeration<String> getHeaderNames() {
            Set<String> noms = new LinkedHashSet<>();
            for (Enumeration<String> e = super.getHeaderNames(); e.hasMoreElements(); ) {
                String nom = e.nextElement();
                if (!valeurs.containsKey(nom)) {
                    noms.add(nom);
                }
            }
            valeurs.forEach((nom, valeur) -> {
                if (valeur.get() != null) {
                    noms.add(nom);
                }
            });
            return Collections.enumeration(noms);
        }
    }
}
