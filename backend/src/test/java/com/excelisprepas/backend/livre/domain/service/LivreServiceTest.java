package com.excelisprepas.backend.livre.domain.service;

import com.excelisprepas.backend.livre.domain.model.Livre;
import com.excelisprepas.backend.livre.domain.port.out.LivreRepositoryPort;
import com.excelisprepas.backend.shared.exception.LivreIntrouvableException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class LivreServiceTest {

    private LivreRepositoryPort livreRepositoryPort;
    private LivreService livreService;

    @BeforeEach
    void setUp() {
        livreRepositoryPort = mock(LivreRepositoryPort.class);
        livreService = new LivreService(livreRepositoryPort);
    }

    @Test
    @DisplayName("listerTous retourne tous les livres")
    void listerTousRetourneTousLesLivres() {
        Livre l1 = Livre.nouveau("AXIOME", "Maths", new BigDecimal("10000"));
        Livre l2 = Livre.nouveau("VECTEUR", "Physique", new BigDecimal("9000"));
        when(livreRepositoryPort.findAll()).thenReturn(List.of(l1, l2));

        List<Livre> resultat = livreService.listerTous();

        assertThat(resultat).hasSize(2);
        assertThat(resultat.get(0).getTitre()).isEqualTo("AXIOME");
    }

    @Test
    @DisplayName("creerLivre persiste un nouveau livre")
    void creerLivrePersisteNouveauLivre() {
        when(livreRepositoryPort.save(any(Livre.class))).thenAnswer(i -> i.getArgument(0));

        Livre cree = livreService.creerLivre("GENE", "Biologie", new BigDecimal("10000"));

        assertThat(cree).isNotNull();
        assertThat(cree.getTitre()).isEqualTo("GENE");
        assertThat(cree.getPrix()).isEqualByComparingTo("10000");
        assertThat(cree.isActif()).isTrue();
        verify(livreRepositoryPort).save(any(Livre.class));
    }

    @Test
    @DisplayName("modifierLivre met à jour les informations du livre")
    void modifierLivreMetAJourLesInfos() {
        UUID id = UUID.randomUUID();
        Livre existant = new Livre(id, "ARCHE", "Annales", new BigDecimal("9000"), true, null);
        when(livreRepositoryPort.findById(id)).thenReturn(Optional.of(existant));
        when(livreRepositoryPort.save(any(Livre.class))).thenAnswer(i -> i.getArgument(0));

        Livre modifie = livreService.modifierLivre(id, "ARCHE V2", "Nouvelle version", new BigDecimal("9500"), true);

        assertThat(modifie.getTitre()).isEqualTo("ARCHE V2");
        assertThat(modifie.getPrix()).isEqualByComparingTo("9500");
    }

    @Test
    @DisplayName("supprimerLivre lève LivreIntrouvableException si livre inexistant")
    void supprimerLivreInexistant() {
        UUID id = UUID.randomUUID();
        when(livreRepositoryPort.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> livreService.supprimerLivre(id))
                .isInstanceOf(LivreIntrouvableException.class);
    }
}

