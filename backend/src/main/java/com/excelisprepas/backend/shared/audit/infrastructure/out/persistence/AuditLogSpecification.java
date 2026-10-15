package com.excelisprepas.backend.shared.audit.infrastructure.out.persistence;

import com.excelisprepas.backend.shared.audit.domain.model.AuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public class AuditLogSpecification {

    public static Specification<AuditLog> avecFiltres(
            String module,
            UUID centreId,
            UUID utilisateurId,
            Instant dateDebut,
            Instant dateFin,
            String recherche
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (module != null && !module.isBlank() && !module.equalsIgnoreCase("TOUS")) {
                predicates.add(cb.equal(cb.upper(root.get("module")), module.toUpperCase()));
            }

            if (centreId != null) {
                predicates.add(cb.equal(root.get("centreId"), centreId));
            }

            if (utilisateurId != null) {
                predicates.add(cb.equal(root.get("utilisateurId"), utilisateurId));
            }

            if (dateDebut != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), dateDebut));
            }

            if (dateFin != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), dateFin));
            }

            if (recherche != null && !recherche.isBlank()) {
                String pattern = "%" + recherche.toLowerCase().trim() + "%";
                Predicate matchDescription = cb.like(cb.lower(root.get("description")), pattern);
                Predicate matchUtilisateur = cb.like(cb.lower(root.get("utilisateurNom")), pattern);
                Predicate matchEmail = cb.like(cb.lower(root.get("utilisateurEmail")), pattern);
                predicates.add(cb.or(matchDescription, matchUtilisateur, matchEmail));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
