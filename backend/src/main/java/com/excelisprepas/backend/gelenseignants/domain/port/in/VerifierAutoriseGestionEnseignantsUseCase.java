package com.excelisprepas.backend.gelenseignants.domain.port.in;

import com.excelisprepas.backend.personnel.domain.model.RoleUtilisateur;

/**
 * Garde métier appelée par les use cases de gestion des enseignants (personnel,
 * affectation-départementale) avant d'exécuter leur action. Rejette l'appel si le
 * gel est effectif pour un Chef de Département.
 *
 * Placeholder de sécurité : {@code appelant} est aujourd'hui auto-déclaré par le
 * frontend (header HTTP), pas vérifié cryptographiquement — le backend n'a encore
 * aucun mécanisme d'authentification réel (voir notes du module `auth`). À remplacer
 * par un vrai principal une fois ce chantier fait.
 */
public interface VerifierAutoriseGestionEnseignantsUseCase {
    void verifierAutorise(RoleUtilisateur appelant);
}
