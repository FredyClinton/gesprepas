package com.excelisprepas.backend.shared.audit;

import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import com.excelisprepas.backend.shared.audit.domain.model.AuditLog;
import com.excelisprepas.backend.shared.audit.infrastructure.out.persistence.AuditLogRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@TestPropertySource(properties = "spring.jpa.hibernate.ddl-auto=create-drop")
@DisplayName("AuditLogRepository (test d'intégration)")
class AuditLogRepositoryTest extends AbstractIntegrationTest {

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Test
    @DisplayName("save() puis findById() persiste et relit correctement l'entrée d'audit avec détails JSONB")
    void saveEtFindByIdPersisteAvecJsonb() {
        UUID id = UUID.randomUUID();
        AuditLog auditLog = AuditLog.builder()
                .id(id)
                .createdAt(Instant.now())
                .utilisateurId(UUID.randomUUID())
                .utilisateurNom("Jean Dupont")
                .utilisateurEmail("j.dupont@excelis.com")
                .utilisateurRole("COMPTABLE")
                .centreId(UUID.randomUUID())
                .centreNom("Bafoussam")
                .module("FINANCE")
                .typeAction("CREATION_VERSEMENT")
                .description("Versement bancaire de 50 000 FCFA")
                .entiteType("MouvementFinancier")
                .entiteId(UUID.randomUUID().toString())
                .statut("SUCCES")
                .details(Map.of("montant", 50000, "banque", "UBA"))
                .adresseIp("192.168.1.50")
                .build();

        auditLogRepository.save(auditLog);

        Optional<AuditLog> result = auditLogRepository.findById(id);

        assertThat(result).isPresent();
        assertThat(result.get().getDescription()).isEqualTo("Versement bancaire de 50 000 FCFA");
        assertThat(result.get().getModule()).isEqualTo("FINANCE");
        assertThat(result.get().getDetails()).containsEntry("banque", "UBA");
    }
}
