package com.excelisprepas.backend.shared.config;

import org.springframework.aop.Advisor;
import org.springframework.aop.support.DefaultPointcutAdvisor;
import org.springframework.aop.support.StaticMethodMatcherPointcut;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Role;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.interceptor.NameMatchTransactionAttributeSource;
import org.springframework.transaction.interceptor.RollbackRuleAttribute;
import org.springframework.transaction.interceptor.RuleBasedTransactionAttribute;
import org.springframework.transaction.interceptor.TransactionInterceptor;

import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.util.List;

/**
 * Chaque méthode publique d'un service du domaine ({@code ..domain.service..}) s'exécute
 * dans une transaction (REQUIRED, annulée sur toute exception).
 *
 * <p>Déclaré ici plutôt qu'avec {@code @Transactional} sur les services, pour que le
 * domaine reste sans Spring. Sans cela, chaque appel à un dépôt était sa propre
 * transaction : une opération en plusieurs écritures (supprimer une entrée et ses
 * ventes de livres, clôturer un bilan et y rattacher ses mouvements...) pouvait
 * s'arrêter à moitié et laisser la base incohérente.
 *
 * <p>Les appels d'un service à un autre rejoignent la transaction déjà ouverte.
 */
@Configuration
public class TransactionsDomaineConfig {

    private static final String PAQUETAGE_RACINE = "com.excelisprepas.backend.";
    private static final String SEGMENT_SERVICES = ".domain.service";

    @Bean
    @Role(BeanDefinition.ROLE_INFRASTRUCTURE) // pris en compte par le proxy automatique des transactions
    public static Advisor transactionsServicesDomaine(
            org.springframework.beans.factory.ObjectProvider<PlatformTransactionManager> transactionManager) {
        RuleBasedTransactionAttribute attribut = new RuleBasedTransactionAttribute(
                TransactionDefinition.PROPAGATION_REQUIRED,
                List.of(new RollbackRuleAttribute(Exception.class)));
        NameMatchTransactionAttributeSource source = new NameMatchTransactionAttributeSource();
        source.addTransactionalMethod("*", attribut);

        TransactionInterceptor intercepteur = new TransactionInterceptor();
        intercepteur.setTransactionAttributeSource(source);
        // Gestionnaire résolu au premier appel (IntercepteurDiffere) : un bean d'infrastructure
        // statique ne doit pas forcer la création du gestionnaire au démarrage du contexte.
        return new DefaultPointcutAdvisor(new ServicesDomainePointcut(), new IntercepteurDiffere(transactionManager, intercepteur));
    }

    /** Méthodes publiques, non statiques, déclarées par une classe d'un paquetage {@code ..domain.service}. */
    static final class ServicesDomainePointcut extends StaticMethodMatcherPointcut {
        @Override
        public boolean matches(Method method, Class<?> targetClass) {
            String paquetage = targetClass.getPackageName();
            return paquetage.startsWith(PAQUETAGE_RACINE)
                    && (paquetage.endsWith(SEGMENT_SERVICES) || paquetage.contains(SEGMENT_SERVICES + "."))
                    && Modifier.isPublic(method.getModifiers())
                    && !Modifier.isStatic(method.getModifiers())
                    && method.getDeclaringClass() != Object.class;
        }
    }

    /** Fournit le gestionnaire de transactions à l'intercepteur au premier appel seulement. */
    static final class IntercepteurDiffere implements org.aopalliance.intercept.MethodInterceptor {
        private final org.springframework.beans.factory.ObjectProvider<PlatformTransactionManager> transactionManager;
        private final TransactionInterceptor delegue;
        private volatile boolean initialise;

        IntercepteurDiffere(org.springframework.beans.factory.ObjectProvider<PlatformTransactionManager> transactionManager,
                            TransactionInterceptor delegue) {
            this.transactionManager = transactionManager;
            this.delegue = delegue;
        }

        @Override
        public Object invoke(org.aopalliance.intercept.MethodInvocation invocation) throws Throwable {
            if (!initialise) {
                synchronized (this) {
                    if (!initialise) {
                        delegue.setTransactionManager(transactionManager.getObject());
                        initialise = true;
                    }
                }
            }
            return delegue.invoke(invocation);
        }
    }
}
