package com.excelisprepas.backend.personnel.domain.port.in;

import java.util.UUID;

/**
 * Changement de mot de passe par l'utilisateur lui-même (page "Mon profil") : contrairement à
 * {@link ChangerMotDePasseUseCase} (réinitialisation par un administrateur), le mot de passe
 * actuel doit être fourni et vérifié.
 */
public interface ChangerMonMotDePasseUseCase {
    void changerMonMotDePasse(UUID utilisateurId, String motDePasseActuel, String nouveauMotDePasse);
}
