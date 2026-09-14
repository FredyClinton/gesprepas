package com.excelisprepas.backend.auth.domain.port.out;

import com.excelisprepas.backend.auth.domain.model.ContexteUtilisateur;

/**
 * Résout les permissions effectives de l'utilisateur actuellement
 * authentifié (rôle global + attributions centre-scopées pour la session
 * académique active). Injecté dans les services domaine qui ont besoin de
 * vérifier un scope centre en plus de la permission elle-même (ex :
 * ValidationMouvementService), suivant le même principe que les autres
 * *RepositoryPort injectés inter-modules.
 */
public interface ContexteUtilisateurPort {
    ContexteUtilisateur courant();
}
