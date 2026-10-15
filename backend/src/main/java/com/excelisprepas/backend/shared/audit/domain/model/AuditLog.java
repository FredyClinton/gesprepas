package com.excelisprepas.backend.shared.audit.domain.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    private UUID id;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "utilisateur_id")
    private UUID utilisateurId;

    @Column(name = "utilisateur_nom")
    private String utilisateurNom;

    @Column(name = "utilisateur_email")
    private String utilisateurEmail;

    @Column(name = "utilisateur_role")
    private String utilisateurRole;

    @Column(name = "centre_id")
    private UUID centreId;

    @Column(name = "centre_nom")
    private String centreNom;

    @Column(name = "module", nullable = false)
    private String module;

    @Column(name = "type_action", nullable = false)
    private String typeAction;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "entite_type")
    private String entiteType;

    @Column(name = "entite_id")
    private String entiteId;

    @Column(name = "statut", nullable = false)
    @Builder.Default
    private String statut = "SUCCES";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "details", columnDefinition = "jsonb")
    private Map<String, Object> details;

    @Column(name = "adresse_ip")
    private String adresseIp;
}
