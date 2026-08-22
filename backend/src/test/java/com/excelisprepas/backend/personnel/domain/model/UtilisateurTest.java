package com.excelisprepas.backend.personnel.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class UtilisateurTest {

    private static UUID unId() {
        return UUID.randomUUID();
    }

    @Nested
    @DisplayName("Création d'un Utilisateur")
    class Creation {

        @Test
        @DisplayName("crée un utilisateur valide avec des données correctes")
        void creeUnUtilisateurValide() {
            Utilisateur utilisateur = new Utilisateur(
                    unId(), "Abega", "Flore", "abega.flore@excelis.local",
                    "hash-bcrypt-simule", RoleUtilisateur.CAISSIER);

            assertThat(utilisateur.getNom()).isEqualTo("Abega");
            assertThat(utilisateur.getEmail()).isEqualTo("abega.flore@excelis.local");
            assertThat(utilisateur.getRole()).isEqualTo(RoleUtilisateur.CAISSIER);
            assertThat(utilisateur.getModeCalculPaie()).isEqualTo(ModeCalculPaie.FIXE);
            assertThat(utilisateur.getCentreId()).isNull();
        }

        @ParameterizedTest
        @DisplayName("rejette les formats d'email invalides")
        @ValueSource(strings = {"pasunemail", "sans-arobase.com", "@sansdebut.com", "email@", "email@sansdomaine"})
        void rejetteEmailInvalide(String emailInvalide) {
            assertThatThrownBy(() ->
                    new Utilisateur(unId(), "Abega", "Flore", emailInvalide,
                            "hash-bcrypt-simule", RoleUtilisateur.CAISSIER))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("email");
        }

        @Test
        @DisplayName("rejette un email nul")
        void rejetteEmailNul() {
            assertThatThrownBy(() ->
                    new Utilisateur(unId(), "Abega", "Flore", null,
                            "hash-bcrypt-simule", RoleUtilisateur.CAISSIER))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("email");
        }

        @Test
        @DisplayName("rejette un hash de mot de passe vide")
        void rejetteMotDePasseHashVide() {
            assertThatThrownBy(() ->
                    new Utilisateur(unId(), "Abega", "Flore", "abega.flore@excelis.local",
                            "", RoleUtilisateur.CAISSIER))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("motDePasseHash");
        }

        @Test
        @DisplayName("rejette un rôle nul")
        void rejetteRoleNul() {
            assertThatThrownBy(() ->
                    new Utilisateur(unId(), "Abega", "Flore", "abega.flore@excelis.local",
                            "hash-bcrypt-simule", null))
                    .isInstanceOf(NullPointerException.class)
                    .hasMessageContaining("role");
        }
    }

    @Nested
    @DisplayName("Comportements d'un Utilisateur existant")
    class Comportements {

        private Utilisateur unUtilisateur() {
            return new Utilisateur(unId(), "Abega", "Flore", "abega.flore@excelis.local",
                    "hash-bcrypt-simule", RoleUtilisateur.CAISSIER);
        }

        @Test
        @DisplayName("changerEmail met à jour l'email si valide")
        void changerEmailFonctionne() {
            Utilisateur utilisateur = unUtilisateur();

            utilisateur.changerEmail("nouvel.email@excelis.local");

            assertThat(utilisateur.getEmail()).isEqualTo("nouvel.email@excelis.local");
        }

        @Test
        @DisplayName("changerEmail rejette un format invalide")
        void changerEmailRejetteFormatInvalide() {
            Utilisateur utilisateur = unUtilisateur();

            assertThatThrownBy(() -> utilisateur.changerEmail("pasunemail"))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("changerMotDePasseHash met à jour le hash")
        void changerMotDePasseHashFonctionne() {
            Utilisateur utilisateur = unUtilisateur();

            utilisateur.changerMotDePasseHash("nouveau-hash");

            assertThat(utilisateur.getMotDePasseHash()).isEqualTo("nouveau-hash");
        }

        @Test
        @DisplayName("rattacherACentre définit le centreId")
        void rattacherACentreFonctionne() {
            Utilisateur utilisateur = unUtilisateur();
            UUID centreId = unId();

            utilisateur.rattacherACentre(centreId);

            assertThat(utilisateur.getCentreId()).isEqualTo(centreId);
        }

        @Test
        @DisplayName("detacherDuCentre remet centreId à null")
        void detacherDuCentreFonctionne() {
            Utilisateur utilisateur = unUtilisateur();
            utilisateur.rattacherACentre(unId());

            utilisateur.detacherDuCentre();

            assertThat(utilisateur.getCentreId()).isNull();
        }
    }

    @Nested
    @DisplayName("Égalité entre Enseignants")
    class Egalite {

        @Test
        @DisplayName("deux enseignants avec le même id sont égaux, même si le reste diffère")
        void memeIdImpliqueEgalite() {
            UUID id = unId();
            Enseignant e1 = new Enseignant(id, "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
            Enseignant e2 = new Enseignant(id, "Autre", "Nom", "MAT-999", new BigDecimal("1"));

            assertThat(e1).isEqualTo(e2);
            assertThat(e1.hashCode()).isEqualTo(e2.hashCode());
        }

        @Test
        @DisplayName("deux enseignants avec des id différents ne sont pas égaux")
        void idDifferentImpliqueInegalite() {
            Enseignant e1 = new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
            Enseignant e2 = new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));

            assertThat(e1).isNotEqualTo(e2);
        }

        @Test
        @DisplayName("deux enseignants avec le même matricule mais des id différents ne sont PAS égaux "
                + "(equals() se base sur l'identité technique id, pas sur le matricule métier — "
                + "l'unicité du matricule est garantie en amont par le service, pas par equals())")
        void memeMatriculeMaisIdDifferentImpliqueInegalite() {
            Enseignant e1 = new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));
            Enseignant e2 = new Enseignant(unId(), "Soh", "Wilson", "MAT-001", new BigDecimal("6000"));

            assertThat(e1).isNotEqualTo(e2);
            assertThat(e1.getMatricule()).isEqualTo(e2.getMatricule()); // même matricule...
            assertThat(e1.getId()).isNotEqualTo(e2.getId());            // ...mais id distincts → pas égaux
        }

        @Test
        @DisplayName("un enseignant n'est jamais égal à null")
        void nEstJamaisEgalANull() {
            Enseignant e1 = new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));

            assertThat(e1).isNotEqualTo(null);
        }

        @Test
        @DisplayName("un enseignant n'est jamais égal à un objet d'un autre type")
        void nEstJamaisEgalAUnAutreType() {
            Enseignant e1 = new Enseignant(unId(), "Ossegue", "Jean", "MAT-001", new BigDecimal("5000"));

            assertThat(e1).isNotEqualTo("une chaîne de caractères");
        }
    }

}