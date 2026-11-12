package com.excelisprepas.backend.shared.config;

import com.excelisprepas.backend.financier.domain.port.out.BilanJournalierRepositoryPort;
import com.excelisprepas.backend.financier.domain.service.BilanJournalierService;
import com.excelisprepas.backend.financier.domain.service.MouvementFinancierService;
import com.excelisprepas.backend.shared.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.aop.framework.Advised;
import org.springframework.aop.support.AopUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Contexte complet sur un vrai PostgreSQL : vérifie aussi, au passage, que les
 * migrations Flyway produisent un schéma accepté par ddl-auto=validate.
 */
@SpringBootTest
class TransactionsDomaineIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MouvementFinancierService mouvementFinancierService;

    @Autowired
    private BilanJournalierService bilanJournalierService;

    @Autowired
    private BilanJournalierRepositoryPort bilanRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void lesServicesDuDomaineSontEnveloppesDansUneTransaction() {
        for (Object service : new Object[]{mouvementFinancierService, bilanJournalierService}) {
            assertThat(AopUtils.isAopProxy(service)).as("proxy pour %s", service.getClass()).isTrue();
            assertThat(Arrays.stream(((Advised) service).getAdvisors()))
                    .anyMatch(a -> a.getAdvice() instanceof TransactionsDomaineConfig.IntercepteurDiffere);
        }
    }

    @Test
    void verrouillerJourneeHorsTransactionEstRefuse() {
        assertThatThrownBy(() -> bilanRepository.verrouillerJournee(UUID.randomUUID(), UUID.randomUUID(), LocalDate.now()))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void leVerrouDeJourneeEstTenuJusquALaFinDeLaTransaction() throws Exception {
        UUID centreId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        LocalDate date = LocalDate.of(2026, 11, 11);
        String cle = "caisse|" + centreId + "|" + sessionId + "|" + date;

        CountDownLatch verrouPris = new CountDownLatch(1);
        CountDownLatch relacher = new CountDownLatch(1);
        CompletableFuture<Void> detenteur = CompletableFuture.runAsync(() ->
                transactionTemplate.executeWithoutResult(status -> {
                    bilanRepository.verrouillerJournee(centreId, sessionId, date);
                    verrouPris.countDown();
                    try {
                        relacher.await(10, TimeUnit.SECONDS);
                    } catch (InterruptedException e) {
                        Thread.currentThread().interrupt();
                    }
                }));

        assertThat(verrouPris.await(10, TimeUnit.SECONDS)).isTrue();
        assertThat(essayerVerrou(cle)).as("pris par l'autre transaction").isFalse();
        assertThat(essayerVerrou("caisse|" + centreId + "|" + sessionId + "|" + date.plusDays(1)))
                .as("autre journée, indépendante").isTrue();

        relacher.countDown();
        detenteur.get(10, TimeUnit.SECONDS);
        assertThat(essayerVerrou(cle)).as("relâché au commit").isTrue();
    }

    private boolean essayerVerrou(String cle) {
        return Boolean.TRUE.equals(transactionTemplate.execute(status -> jdbcTemplate.queryForObject(
                "SELECT pg_try_advisory_xact_lock(hashtextextended(?, 0))", Boolean.class, cle)));
    }
}
