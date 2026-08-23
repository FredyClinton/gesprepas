package com.excelisprepas.backend.personnel.infrastructure.out.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class BCryptPasswordEncoderAdapterTest {
    private final BCryptPasswordEncoderAdapter encoder = new BCryptPasswordEncoderAdapter();

    @Test
    @DisplayName("encoder() produit un hash différent du mot de passe en clair")
    void encoderProduitUnHashDifferentDuClair() {
        // Given

        String motDePasseClair = "modepasseSecret123";

        // When
        String hash = encoder.encoder(motDePasseClair);

        // Then
        assertThat(hash).isNotEqualTo(motDePasseClair);
        assertThat(hash).isNotBlank();
    }

    @Test
    @DisplayName("correspond() retourne faux quand le mot de passe en clair ne correspond pas au hash")
    void correspondRetourneFauxSiPasDeCorrespondance() {
        // Given

        String hash = encoder.encoder("motdepasseSecret123");

        // When
        boolean resultat = encoder.correspond("mauvaisMotDePasse", hash);

        // Then
        assertThat(resultat).isFalse();
    }
}
