package com.excelisprepas.backend.shared.audit.application;

import com.excelisprepas.backend.auth.domain.model.ClaimsAccessToken;
import com.excelisprepas.backend.centre.domain.model.Centre;
import com.excelisprepas.backend.centre.domain.port.out.CentreRepositoryPort;
import com.excelisprepas.backend.personnel.domain.port.out.PersonnelRepositoryPort;
import com.excelisprepas.backend.shared.audit.domain.event.AuditLogEvent;
import com.excelisprepas.backend.shared.audit.domain.event.AuditModule;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.Map;
import java.util.UUID;

@Component
@Slf4j
public class AuditEventHelper {

    private final ApplicationEventPublisher eventPublisher;
    private final PersonnelRepositoryPort personnelRepositoryPort;
    private final CentreRepositoryPort centreRepositoryPort;

    public AuditEventHelper(
            ApplicationEventPublisher eventPublisher,
            @Autowired(required = false) PersonnelRepositoryPort personnelRepositoryPort,
            @Autowired(required = false) CentreRepositoryPort centreRepositoryPort
    ) {
        this.eventPublisher = eventPublisher;
        this.personnelRepositoryPort = personnelRepositoryPort;
        this.centreRepositoryPort = centreRepositoryPort;
    }

    public void audit(
            AuditModule module,
            String typeAction,
            String description,
            String entiteType,
            String entiteId,
            Map<String, Object> details
    ) {
        audit(module, typeAction, description, entiteType, entiteId, details, null);
    }

    public void audit(
            AuditModule module,
            String typeAction,
            String description,
            String entiteType,
            String entiteId,
            Map<String, Object> details,
            UUID centreIdSpecifique
    ) {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            UUID userId = null;
            String userEmail = null;
            String userRole = null;
            String userNom = "Système";
            UUID centreId = centreIdSpecifique;
            String centreNom = null;

            if (auth != null && auth.getPrincipal() instanceof ClaimsAccessToken claims) {
                userId = claims.utilisateurId();
                userEmail = claims.email();
                userRole = claims.role() != null ? claims.role().name() : null;
                if (centreId == null) {
                    centreId = claims.centreId();
                }

                if (personnelRepositoryPort != null && userId != null) {
                    userNom = personnelRepositoryPort.findById(userId)
                            .map(p -> {
                                String nom = p.getNom() != null ? p.getNom() : "";
                                String prenom = p.getPrenom() != null ? p.getPrenom() : "";
                                return (nom + " " + prenom).trim();
                            })
                            .filter(s -> !s.isBlank())
                            .orElse(claims.email() != null ? claims.email() : "Utilisateur");
                } else if (claims.email() != null) {
                    userNom = claims.email();
                }
            }

            if (centreRepositoryPort != null && centreId != null) {
                centreNom = centreRepositoryPort.findById(centreId)
                        .map(Centre::getNom)
                        .orElse(null);
            }

            String adresseIp = extraireAdresseIp();

            AuditLogEvent event = AuditLogEvent.create(
                    userId,
                    userNom,
                    userEmail,
                    userRole,
                    centreId,
                    centreNom,
                    module,
                    typeAction,
                    description,
                    entiteType,
                    entiteId,
                    details != null ? details : Map.of(),
                    adresseIp
            );

            eventPublisher.publishEvent(event);
        } catch (Exception e) {
            log.warn("Impossible d'émettre l'événement d'audit {} : {}", typeAction, e.getMessage());
        }
    }

    private String extraireAdresseIp() {
        try {
            if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
                HttpServletRequest req = attrs.getRequest();
                String xForwardedFor = req.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return req.getRemoteAddr();
            }
        } catch (Exception ignored) {
        }
        return null;
    }
}
